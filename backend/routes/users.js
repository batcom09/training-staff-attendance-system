const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { requireRole, requireSameUserOrRole } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.phone, u.profile_image_url, u.is_active,
                   d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            departmentId: user.department_id,
            departmentName: user.department_name,
            phone: user.phone,
            profileImageUrl: user.profile_image_url,
            isActive: user.is_active
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const schema = Joi.object({
            fullName: Joi.string().min(2).max(100).optional(),
            phone: Joi.string().optional(),
            departmentId: Joi.string().uuid().optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { fullName, phone, departmentId } = value;

        const result = await pool.query(`
            UPDATE users 
            SET full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                department_id = COALESCE($3, department_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, email, full_name, role, department_id, phone, profile_image_url, is_active
        `, [fullName, phone, departmentId, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            departmentId: user.department_id,
            phone: user.phone,
            profileImageUrl: user.profile_image_url,
            isActive: user.is_active
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get all users (admin only)
router.get('/', requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, departmentId, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.phone, u.profile_image_url, u.is_active, u.created_at,
                   d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (role) {
            query += ` AND u.role = $${paramIndex++}`;
            params.push(role);
        }

        if (departmentId) {
            query += ` AND u.department_id = $${paramIndex++}`;
            params.push(departmentId);
        }

        if (search) {
            query += ` AND (u.full_name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++})`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM users u WHERE 1=1`;
        const countParams = [];
        let countIndex = 1;

        if (role) {
            countQuery += ` AND u.role = $${countIndex++}`;
            countParams.push(role);
        }

        if (departmentId) {
            countQuery += ` AND u.department_id = $${countIndex++}`;
            countParams.push(departmentId);
        }

        if (search) {
            countQuery += ` AND (u.full_name ILIKE $${countIndex++} OR u.email ILIKE $${countIndex++})`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows.map(user => ({
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                departmentName: user.department_name,
                phone: user.phone,
                profileImageUrl: user.profile_image_url,
                isActive: user.is_active,
                createdAt: user.created_at
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Get departments
router.get('/departments', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, code, supervisor_id
            FROM departments
            ORDER BY name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to get departments' });
    }
});

module.exports = router;
