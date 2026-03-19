const express = require('express');
const router = express.Router();
const pool = require('../config/database-mock');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../middleware/logging');

// Validation schemas
const profileSchema = Joi.object({
    token: Joi.string().required(),
    full_name: Joi.string().required().max(100),
    phone_number: Joi.string().required().max(20),
    address: Joi.string().required(),
    email: Joi.string().email().required(),
    birthdate: Joi.date().required(),
    afpsn: Joi.string().required().max(50),
    age: Joi.number().integer().min(18).max(65).required(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').required(),
    nationality: Joi.string().required(),
    nationality_other: Joi.string().allow('', null).when('nationality', {
        is: 'other',
        then: Joi.required()
    }),
    pa_rank_code: Joi.string().required(),
    other_background: Joi.string().allow('', null)
});

const completeSchema = Joi.object({
    token: Joi.string().required(),
    new_username: Joi.string().required().min(3),
    password: Joi.string().required().min(8)
});

// GET /api/onboarding/verify
router.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    try {
        // For now, we'll assume the token is a JWT containing the user ID
        // In a real scenario, this would be a specific onboarding token record
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const result = await pool.query(
            'SELECT id, email, full_name as name FROM users WHERE id = $1',
            [decoded.userId || decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.rows[0];
        // Generate a temporary username if not set
        user.username = user.email.split('@')[0];

        res.json({ success: true, user });
    } catch (error) {
        logger.error('Token verification error:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
});

// POST /api/onboarding/profile
router.post('/profile', async (req, res) => {
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const decoded = jwt.verify(value.token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        // Check if rank exists
        const rankCheck = await pool.query('SELECT 1 FROM ref_philippine_army_ranks WHERE rank_code = $1', [value.pa_rank_code]);
        if (rankCheck.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid Philippine Army rank' });
        }

        await pool.query(`
            INSERT INTO profiles (
                user_id, full_name, address, phone_number, email, birthdate, 
                afpsn, age, gender, nationality, nationality_other, pa_rank_code, other_background
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (user_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                address = EXCLUDED.address,
                phone_number = EXCLUDED.phone_number,
                email = EXCLUDED.email,
                birthdate = EXCLUDED.birthdate,
                afpsn = EXCLUDED.afpsn,
                age = EXCLUDED.age,
                gender = EXCLUDED.gender,
                nationality = EXCLUDED.nationality,
                nationality_other = EXCLUDED.nationality_other,
                pa_rank_code = EXCLUDED.pa_rank_code,
                other_background = EXCLUDED.other_background,
                updated_at = CURRENT_TIMESTAMP
        `, [
            userId, value.full_name, value.address, value.phone_number, value.email, value.birthdate,
            value.afpsn, value.age, value.gender, value.nationality, value.nationality_other, 
            value.pa_rank_code, value.other_background
        ]);

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        logger.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// POST /api/onboarding/complete
router.post('/complete', async (req, res) => {
    const { error, value } = completeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    try {
        const decoded = jwt.verify(value.token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(value.password, salt);

        // Update user account
        await pool.query(`
            UPDATE users 
            SET password_hash = $1, 
                full_name = (SELECT full_name FROM profiles WHERE user_id = $2),
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [hashedPassword, userId]);

        // Mark profile as completed
        await pool.query(`
            UPDATE profiles 
            SET profile_completed = true, 
                completed_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1
        `, [userId]);

        res.json({ success: true, message: 'Registration complete' });
    } catch (error) {
        logger.error('Completion error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete registration' });
    }
});

// GET /api/reference/philippine-army-ranks
router.get('/ranks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rank_code, rank_name, rank_category, grade, 
                   rank_code || ' - ' || rank_name || ' (' || grade || ')' as display_label
            FROM ref_philippine_army_ranks
            ORDER BY display_order
        `);

        const data = {
            commissioned_officers: result.rows.filter(r => r.rank_category === 'commissioned_officer'),
            enlisted_personnel: result.rows.filter(r => r.rank_category === 'enlisted_personnel')
        };

        res.json({ success: true, data });
    } catch (error) {
        logger.error('Ranks fetch error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ranks' });
    }
});

module.exports = router;
