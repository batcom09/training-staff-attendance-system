const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get today's attendance status
router.get('/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const result = await pool.query(`
            SELECT ar.*, ts.session_date, ts.start_time, ts.end_time, ts.location,
                   tp.name as program_name
            FROM attendance_records ar
            JOIN training_sessions ts ON ar.session_id = ts.id
            JOIN training_programs tp ON ts.program_id = tp.id
            WHERE ar.trainee_id = $1 AND ts.session_date = $2
            ORDER BY ts.start_time
        `, [req.user.id, today]);

        res.json(result.rows);
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ error: 'Failed to get today\'s attendance' });
    }
});

// Check in
router.post('/checkin', async (req, res) => {
    try {
        const schema = Joi.object({
            sessionId: Joi.string().uuid().required(),
            method: Joi.string().valid('qr_scan', 'geolocation', 'manual').required(),
            location: Joi.object().optional(),
            notes: Joi.string().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { sessionId, method, location, notes } = value;

        // Check if session exists and is today
        const sessionResult = await pool.query(`
            SELECT id, session_date, start_time, end_time, status
            FROM training_sessions
            WHERE id = $1 AND session_date = CURRENT_DATE
        `, [sessionId]);

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found or not for today' });
        }

        const session = sessionResult.rows[0];
        if (session.status !== 'scheduled') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        // Check if already checked in
        const existingResult = await pool.query(`
            SELECT id FROM attendance_records
            WHERE trainee_id = $1 AND session_id = $2
        `, [req.user.id, sessionId]);

        if (existingResult.rows.length > 0) {
            return res.status(400).json({ error: 'Already checked in for this session' });
        }

        // Insert attendance record
        const result = await pool.query(`
            INSERT INTO attendance_records 
            (trainee_id, session_id, check_in_time, check_in_method, check_in_location, notes)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
            RETURNING *
        `, [req.user.id, sessionId, method, location ? `POINT(${location.lng}, ${location.lat})` : null, notes]);

        res.json({
            message: 'Check-in successful',
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Failed to check in' });
    }
});

// Check out
router.post('/checkout', async (req, res) => {
    try {
        const schema = Joi.object({
            sessionId: Joi.string().uuid().required(),
            method: Joi.string().valid('qr_scan', 'geolocation', 'manual').required(),
            location: Joi.object().optional(),
            notes: Joi.string().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { sessionId, method, location, notes } = value;

        // Update attendance record
        const result = await pool.query(`
            UPDATE attendance_records 
            SET check_out_time = CURRENT_TIMESTAMP,
                check_out_method = $1,
                check_in_location = COALESCE($2, check_in_location),
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE trainee_id = $4 AND session_id = $5 AND check_in_time IS NOT NULL AND check_out_time IS NULL
            RETURNING *
        `, [method, location ? `POINT(${location.lng}, ${location.lat})` : null, notes, req.user.id, sessionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No active check-in found for this session' });
        }

        res.json({
            message: 'Check-out successful',
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ error: 'Failed to check out' });
    }
});

// Get attendance history
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT ar.*, ts.session_date, ts.start_time, ts.end_time, ts.location,
                   tp.name as program_name
            FROM attendance_records ar
            JOIN training_sessions ts ON ar.session_id = ts.id
            JOIN training_programs tp ON ts.program_id = tp.id
            WHERE ar.trainee_id = $1
        `;
        const params = [req.user.id];
        let paramIndex = 2;

        if (startDate) {
            query += ` AND ts.session_date >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND ts.session_date <= $${paramIndex++}`;
            params.push(endDate);
        }

        query += ` ORDER BY ts.session_date DESC, ts.start_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Get attendance history error:', error);
        res.status(500).json({ error: 'Failed to get attendance history' });
    }
});

module.exports = router;
