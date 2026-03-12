const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const pool = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { logger } = require('../middleware/logging');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    fullName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('trainee', 'supervisor', 'admin').default('trainee'),
    departmentId: Joi.string().uuid().optional(),
    phone: Joi.string().optional()
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password, fullName, role, departmentId, phone } = value;

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role, department_id, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, full_name, role, department_id, phone, is_active, created_at
        `, [email, passwordHash, fullName, role, departmentId, phone, true]);

        const user = result.rows[0];

        logger.info('User registered', { userId: user.id, email, role });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                phone: user.phone,
                isActive: user.is_active,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Get user from database
        const result = await pool.query(`
            SELECT id, email, password_hash, full_name, role, department_id, phone, is_active
            FROM users 
            WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is inactive' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        logger.info('User logged in', { userId: user.id, email, role: user.role });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                phone: user.phone,
                isActive: user.is_active
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { error, value } = refreshTokenSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { refreshToken } = value;

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Get user from database
        const result = await pool.query(`
            SELECT id, email, full_name, role, department_id, phone, is_active
            FROM users 
            WHERE id = $1 AND is_active = true
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = result.rows[0];

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

        res.json({
            tokens: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    // In a production environment, you might want to implement token blacklisting
    res.json({ message: 'Logout successful' });
});

// Verify token
router.get('/verify', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const result = await pool.query(`
            SELECT id, email, full_name, role, department_id, phone, is_active
            FROM users 
            WHERE id = $1 AND is_active = true
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = result.rows[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                phone: user.phone,
                isActive: user.is_active
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
