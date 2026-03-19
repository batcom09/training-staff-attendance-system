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
let users = [
  { id: 'field001', code: 'alpha123', level: 'field', name: 'Training Staff' },
  { id: 'command001', code: 'charlie789', level: 'command', name: 'Commandant' },
  { id: 'admin', code: 'admin', level: 'admin', name: 'Administrator' }
];

let attendanceLogs = [
  { id: 1, user: 'Jane Smith', action: 'Completed Training', time: '15 min ago', status: 'info' },
  { id: 2, user: 'John Doe', action: 'Checked in', time: '2 min ago', status: 'success' }
];

let messages = [
  { id: 1, sender: 'Commandant', content: 'Welcome to the new Tactical Operations System.', time: '1 hour ago' }
];

// API Endpoints
app.post('/api/login', (req, res) => {
  const { personnelId, accessCode } = req.body;
  const user = users.find(u => u.id === personnelId && u.code === accessCode);
  
  if (user) {
    res.json({ success: true, token: 'mock-jwt-12345', user: { id: user.id, name: user.name, level: user.level, profile: user.profile } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials. Access Denied.' });
  }
});

app.get('/api/attendance', (req, res) => {
  res.json({ success: true, logs: attendanceLogs });
});

// User Management Endpoints
app.get('/api/users', (req, res) => {
  res.json({ success: true, users });
});

app.post('/api/users', (req, res) => {
  const { id, code, level, name } = req.body;
  if (!id || !code || !level || !name) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  if (users.find(u => u.id === id)) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  users.push({ id, code, level, name });
  res.json({ success: true, user: { id, code, level, name } });
});

app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

// Profile Endpoint
app.post('/api/users/profile', (req, res) => {
  const { userId, bloodType, emergencyContact, background } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) {
    user.profile = { bloodType, emergencyContact, background };
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Messages Endpoints
app.get('/api/messages', (req, res) => {
  res.json({ success: true, messages });
});

app.post('/api/messages', (req, res) => {
  const { sender, content, time } = req.body;
  if (!sender || !content) return res.status(400).json({ success: false, message: 'Missing fields' });
  messages.unshift({ id: Date.now(), sender, content, time: time || new Date().toLocaleTimeString() });
  res.json({ success: true, message: 'Message broadcasted' });
});

// QR Scanning Endpoint
app.post('/api/attendance/scan', (req, res) => {
  const { scannedData, time } = req.body;
  const user = users.find(u => u.id === scannedData);
  if (user) {
    attendanceLogs.unshift({ 
      id: Date.now(), 
      user: user.name, 
      action: 'Checked in via QR Scan', 
      time: time || 'Just now', 
      status: 'success' 
    });
    res.json({ success: true, message: 'Scan successful', user: user.name });
  } else {
    res.status(404).json({ success: false, message: 'Unknown ID scanned' });
  }
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
