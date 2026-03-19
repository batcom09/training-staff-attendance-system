require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Tactical Operations System',
    version: '2.0.1'
  });
});

app.get(['/keep-alive', '/ping'], (req, res) => {
  res.json({
    message: 'System is awake and operational',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
});

// Mock Database
const users = [
  { id: 'field001', code: 'alpha123', level: 'field', name: 'Field Operator' },
  { id: 'squad001', code: 'bravo456', level: 'squad', name: 'Squad Leader' },
  { id: 'command001', code: 'charlie789', level: 'command', name: 'Command Center' },
  { id: 'admin', code: 'admin', level: 'admin', name: 'System Admin' }
];

const attendanceLogs = [
  { id: 1, user: 'Jane Smith', action: 'Completed Training', time: '15 min ago', status: 'info' },
  { id: 2, user: 'John Doe', action: 'Checked in', time: '2 min ago', status: 'success' }
];

// API Endpoints
app.post('/api/login', (req, res) => {
  const { personnelId, accessCode } = req.body;
  const user = users.find(u => u.id === personnelId && u.code === accessCode);
  
  if (user) {
    res.json({ success: true, token: 'mock-jwt-12345', user: { id: user.id, name: user.name, level: user.level } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials. Access Denied.' });
  }
});

app.get('/api/attendance', (req, res) => {
  res.json({ success: true, logs: attendanceLogs });
});

// Fallback routing for SPA
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
      res.sendFile(path.join(__dirname, 'index.html'));
  } else if (req.path === '/login' || req.path === '/login.html') {
      res.sendFile(path.join(__dirname, 'login.html'));
  } else {
      res.sendFile(path.join(__dirname, 'login.html')); // default to login if not found
  }
});

app.listen(port, () => {
  console.log('='.repeat(60));
  console.log(`🎯 Tactical Operations System API`);
  console.log(`🚀 Server running on port ${port}`);
  console.log('='.repeat(60));
});
