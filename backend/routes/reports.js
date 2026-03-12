const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const { departmentId, dateRange = '30' } = req.query;
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let baseQuery = `
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.role = 'trainee' THEN u.id END) as total_trainees,
                COUNT(DISTINCT tp.id) as total_programs,
                COUNT(DISTINCT ts.id) as total_sessions,
                COUNT(DISTINCT ar.id) as total_attendance_records,
                COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_count,
                COUNT(DISTINCT CASE WHEN ar.status = 'late' THEN ar.id END) as late_count,
                COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN ar.id END) as absent_count
            FROM users u
            LEFT JOIN training_programs tp ON 1=1
            LEFT JOIN training_sessions ts ON 1=1
            LEFT JOIN attendance_records ar ON ar.trainee_id = u.id
            WHERE u.is_active = true
        `;

        const params = [];
        let paramIndex = 1;

        if (departmentId && req.user.role !== 'trainee') {
            baseQuery += ` AND u.department_id = $${paramIndex++}`;
            params.push(departmentId);
        }

        if (req.user.role === 'trainee') {
            baseQuery += ` AND u.id = $${paramIndex++}`;
            params.push(req.user.id);
        }

        const result = await pool.query(baseQuery, params);
        const stats = result.rows[0];

        // Calculate attendance percentage
        const totalAttendance = parseInt(stats.present_count) + parseInt(stats.late_count) + parseInt(stats.absent_count);
        const attendancePercentage = totalAttendance > 0 
            ? ((parseInt(stats.present_count) + parseInt(stats.late_count)) / totalAttendance * 100).toFixed(2)
            : 0;

        res.json({
            ...stats,
            attendancePercentage: parseFloat(attendancePercentage)
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
});

// Get attendance report
router.get('/attendance', async (req, res) => {
    try {
        const { startDate, endDate, departmentId, userId, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                u.id as user_id,
                u.full_name,
                u.email,
                d.name as department_name,
                tp.name as program_name,
                ts.session_date,
                ts.start_time,
                ts.end_time,
                ts.location,
                ar.check_in_time,
                ar.check_out_time,
                ar.check_in_method,
                ar.check_out_method,
                ar.status,
                ar.notes
            FROM attendance_records ar
            JOIN users u ON ar.trainee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            JOIN training_sessions ts ON ar.session_id = ts.id
            JOIN training_programs tp ON ts.program_id = tp.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (startDate) {
            query += ` AND ts.session_date >= $${paramIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND ts.session_date <= $${paramIndex++}`;
            params.push(endDate);
        }

        if (departmentId && req.user.role !== 'trainee') {
            query += ` AND u.department_id = $${paramIndex++}`;
            params.push(departmentId);
        }

        if (userId) {
            query += ` AND u.id = $${paramIndex++}`;
            params.push(userId);
        }

        if (req.user.role === 'trainee') {
            query += ` AND u.id = $${paramIndex++}`;
            params.push(req.user.id);
        }

        query += ` ORDER BY ts.session_date DESC, u.full_name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Get attendance report error:', error);
        res.status(500).json({ error: 'Failed to get attendance report' });
    }
});

module.exports = router;
