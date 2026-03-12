const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get training programs
router.get('/programs', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT tp.*, u.full_name as created_by_name,
                   COUNT(ts.id) as session_count,
                   COUNT(e.id) as enrolled_count
            FROM training_programs tp
            LEFT JOIN users u ON tp.created_by = u.id
            LEFT JOIN training_sessions ts ON tp.id = ts.program_id
            LEFT JOIN enrollments e ON tp.id = e.program_id AND e.status = 'active'
        `;

        if (req.user.role === 'trainee') {
            query += ` JOIN enrollments e_trainee ON tp.id = e_trainee.program_id AND e_trainee.trainee_id = $1`;
        }

        query += ` WHERE 1=1`;
        const params = req.user.role === 'trainee' ? [req.user.id] : [];
        let paramIndex = params.length + 1;

        if (status) {
            query += ` AND tp.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` GROUP BY tp.id, u.full_name ORDER BY tp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Get training programs error:', error);
        res.status(500).json({ error: 'Failed to get training programs' });
    }
});

// Get training sessions
router.get('/sessions', async (req, res) => {
    try {
        const { page = 1, limit = 10, programId, date } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ts.*, tp.name as program_name, tp.description as program_description
            FROM training_sessions ts
            JOIN training_programs tp ON ts.program_id = tp.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (programId) {
            query += ` AND ts.program_id = $${paramIndex++}`;
            params.push(programId);
        }

        if (date) {
            query += ` AND ts.session_date = $${paramIndex++}`;
            params.push(date);
        }

        if (req.user.role === 'trainee') {
            query += ` AND EXISTS (
                SELECT 1 FROM enrollments e 
                WHERE e.program_id = ts.program_id AND e.trainee_id = $${paramIndex++} AND e.status = 'active'
            )`;
            params.push(req.user.id);
        }

        query += ` ORDER BY ts.session_date ASC, ts.start_time ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Get training sessions error:', error);
        res.status(500).json({ error: 'Failed to get training sessions' });
    }
});

// Create training program (admin/supervisor only)
router.post('/programs', requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(2).max(200).required(),
            description: Joi.string().optional(),
            startDate: Joi.date().required(),
            endDate: Joi.date().greater(Joi.ref('startDate')).required(),
            scheduleConfig: Joi.object().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, description, startDate, endDate, scheduleConfig } = value;

        const result = await pool.query(`
            INSERT INTO training_programs 
            (name, description, start_date, end_date, schedule_config, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, description, startDate, endDate, JSON.stringify(scheduleConfig || {}), req.user.id]);

        res.status(201).json({
            message: 'Training program created successfully',
            program: result.rows[0]
        });
    } catch (error) {
        console.error('Create training program error:', error);
        res.status(500).json({ error: 'Failed to create training program' });
    }
});

// Create training session (admin/supervisor only)
router.post('/sessions', requireRole(['admin', 'supervisor']), async (req, res) => {
    try {
        const schema = Joi.object({
            programId: Joi.string().uuid().required(),
            sessionDate: Joi.date().required(),
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
            location: Joi.string().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { programId, sessionDate, startTime, endTime, location } = value;

        // Generate unique QR code
        const qrCode = `QR-${programId.toString().slice(-8)}-${Date.now()}`;

        const result = await pool.query(`
            INSERT INTO training_sessions 
            (program_id, session_date, start_time, end_time, location, qr_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [programId, sessionDate, startTime, endTime, location, qrCode]);

        res.status(201).json({
            message: 'Training session created successfully',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('Create training session error:', error);
        res.status(500).json({ error: 'Failed to create training session' });
    }
});

module.exports = router;
