const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function seedDatabase() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'training_attendance',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log('🌱 Seeding database...');

        // Create departments
        const deptResult = await pool.query(`
            INSERT INTO departments (name, code) VALUES 
            ('Information Technology', 'IT'),
            ('Human Resources', 'HR'),
            ('Operations', 'OPS'),
            ('Finance', 'FIN')
            ON CONFLICT (code) DO NOTHING
            RETURNING id, code
        `);

        const departments = deptResult.rows.reduce((acc, dept) => {
            acc[dept.code] = dept.id;
            return acc;
        }, {});

        console.log('✅ Departments created');

        // Create sample users
        const users = [
            {
                email: 'supervisor@training.com',
                password: 'supervisor123',
                fullName: 'John Supervisor',
                role: 'supervisor',
                departmentId: departments.IT
            },
            {
                email: 'trainee1@training.com',
                password: 'trainee123',
                fullName: 'Alice Trainee',
                role: 'trainee',
                departmentId: departments.IT
            },
            {
                email: 'trainee2@training.com',
                password: 'trainee123',
                fullName: 'Bob Trainee',
                role: 'trainee',
                departmentId: departments.HR
            },
            {
                email: 'trainee3@training.com',
                password: 'trainee123',
                fullName: 'Carol Trainee',
                role: 'trainee',
                departmentId: departments.OPS
            }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(`
                INSERT INTO users (email, password_hash, full_name, role, department_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) DO NOTHING
            `, [user.email, hashedPassword, user.fullName, user.role, user.departmentId, true]);
        }

        console.log('✅ Sample users created');

        // Update department supervisors
        await pool.query(`
            UPDATE departments 
            SET supervisor_id = (SELECT id FROM users WHERE email = 'supervisor@training.com')
            WHERE code = 'IT'
        `);

        // Create training programs
        const programResult = await pool.query(`
            INSERT INTO training_programs (name, description, start_date, end_date, created_by)
            VALUES 
                ('React Development Bootcamp', 'Comprehensive React development training', 
                 CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days',
                 (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
                ('Leadership Skills', 'Management and leadership development program',
                 CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '45 days',
                 (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
                ('Data Analytics Fundamentals', 'Introduction to data analysis and visualization',
                 CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days',
                 (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
            RETURNING id
        `);

        const programIds = programResult.rows.map(row => row.id);

        console.log('✅ Training programs created');

        // Enroll trainees in programs
        const traineesResult = await pool.query(`
            SELECT id FROM users WHERE role = 'trainee'
        `);

        const traineeIds = traineesResult.rows.map(row => row.id);

        for (const traineeId of traineeIds) {
            for (const programId of programIds.slice(0, 2)) { // Enroll in first 2 programs
                await pool.query(`
                    INSERT INTO enrollments (trainee_id, program_id, status)
                    VALUES ($1, $2, 'active')
                    ON CONFLICT DO NOTHING
                `, [traineeId, programId]);
            }
        }

        console.log('✅ Enrollments created');

        // Create training sessions
        const sessions = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
            const sessionDate = new Date(today);
            sessionDate.setDate(today.getDate() + i);
            
            programIds.forEach((programId, index) => {
                sessions.push({
                    programId,
                    sessionDate: sessionDate.toISOString().split('T')[0],
                    startTime: '09:00:00',
                    endTime: '17:00:00',
                    location: `Training Room ${index + 1}`,
                    qrCode: `QR-${programId.toString().slice(-8)}-${i}`
                });
            });
        }

        for (const session of sessions) {
            await pool.query(`
                INSERT INTO training_sessions 
                (program_id, session_date, start_time, end_time, location, qr_code, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (qr_code) DO NOTHING
            `, [session.programId, session.sessionDate, session.startTime, 
                session.endTime, session.location, session.qrCode, 'scheduled']);
        }

        console.log('✅ Training sessions created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Login credentials:');
        console.log('Admin: admin@training.com / admin123');
        console.log('Supervisor: supervisor@training.com / supervisor123');
        console.log('Trainee: trainee1@training.com / trainee123');
        console.log('Trainee: trainee2@training.com / trainee123');
        console.log('Trainee: trainee3@training.com / trainee123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
