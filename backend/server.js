const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const trainingRoutes = require('./routes/training');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

const { authenticateToken } = require('./middleware/auth');
const { logRequest } = require('./middleware/logging');
const pool = require('./config/database-mock');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            "img-src": ["'self'", "data:", "https://*"],
        },
    },
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logRequest);

// Serve static frontend files from root
app.use(express.static(path.join(__dirname, '../')));

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Make io available to routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/training', authenticateToken, trainingRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        pool.end(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        pool.end(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    });
});

startServer();

module.exports = { app, io };
