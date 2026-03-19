require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
  { 
    id: 'admin-uuid-123', 
    username: 'admin', 
    email: 'admin@tacticalops.gov', 
    password_hash: bcrypt.hashSync('admin', 10), 
    status: 'ACTIVE', 
    level: 'admin',
    name: 'Administrator',
    created_at: new Date()
  }
];

let profiles = {
  'admin-uuid-123': {
    user_id: 'admin-uuid-123',
    full_name: 'Administrator',
    profile_completed: true
  }
};

let attendanceLogs = [
  { id: 1, user: 'Jane Smith', action: 'Completed Training', time: '15 min ago', status: 'info' },
  { id: 2, user: 'John Doe', action: 'Checked in', time: '2 min ago', status: 'success' }
];

let messages = [
  { id: 1, sender: 'Commandant', content: 'Welcome to the new Tactical Operations System.', time: '1 hour ago' }
];

// API Endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username || u.email === username);
  
  if (user && user.status === 'ACTIVE' && bcrypt.compareSync(password, user.password_hash)) {
    res.json({ 
      success: true, 
      token: 'mock-jwt-12345', 
      user: { 
        id: user.id, 
        name: user.name, 
        level: user.level, 
        status: user.status,
        profile: profiles[user.id]
      } 
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials or account not active.' });
  }
});

// Legacy backward compatibility for mock login
app.post('/api/login', (req, res) => {
    const { personnelId, accessCode } = req.body;
    // For admin specifically
    if(personnelId === 'admin' && accessCode === 'admin') {
        const u = users[0];
        return res.json({ success: true, token: 'mock-jwt-12345', user: { id: u.id, name: u.name, level: u.level, status: u.status, profile: profiles[u.id] } });
    }
    res.status(401).json({ success: false, message: 'Legacy login restricted. Use global credentials.' });
});

app.get('/api/attendance', (req, res) => {
  res.json({ success: true, logs: attendanceLogs });
});

// User Management Endpoints
app.get('/api/users', (req, res) => {
  res.json({ success: true, users });
});

// Admin: Create User
app.post('/api/admin/users', (req, res) => {
  const { username, email, level, name } = req.body;
  
  if (!username || !email || !level || !name) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  
  if (users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ success: false, message: 'User or email already exists' });
  }

  const onboarding_token = crypto.randomBytes(32).toString('hex');
  const token_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const newUser = { 
    id: crypto.randomUUID(),
    username, 
    email, 
    level, 
    name, 
    status: 'PENDING',
    onboarding_token,
    token_expires,
    created_at: new Date()
  };

  users.push(newUser);
  
  // Return token in response for simulation (in real app, this goes to email)
  res.json({ 
    success: true, 
    user: newUser,
    onboarding_link: `http://localhost:3000/onboarding.html?token=${onboarding_token}`
  });
});

// Legacy endpoint wrapper
app.post('/api/users', (req, res) => {
    // Treat legacy POST as admin user creation for UI compatibility
    const { id, level, name } = req.body;
    req.body.username = id;
    req.body.email = `${id}@tacticalops.gov`;
    // Re-route internally
    const handler = app._router.stack.find(s => s.route && s.route.path === '/api/admin/users').route.stack[0].handle;
    handler(req, res);
});

app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

// Onboarding: Verify Token
app.get('/api/onboarding/verify', (req, res) => {
  const { token } = req.query;
  const user = users.find(u => u.onboarding_token === token);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Invalid token.' });
  }

  if (new Date() > new Date(user.token_expires)) {
    return res.status(400).json({ success: false, message: 'Token expired. Contact Admin.' });
  }

  res.json({ success: true, user: { username: user.username, email: user.email, name: user.name } });
});

// Onboarding: Submit Profile
app.post('/api/onboarding/profile', (req, res) => {
  const { token, full_name, address, phone_number, birthdate, afpsn, age, gender, nationality, other_background } = req.body;
  const user = users.find(u => u.onboarding_token === token);

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  profiles[user.id] = {
    user_id: user.id,
    full_name,
    address,
    phone_number,
    birthdate,
    afpsn,
    age,
    gender,
    nationality,
    other_background,
    profile_completed: true,
    completed_at: new Date()
  };

  res.json({ success: true, message: 'Profile updated. Proceed to credentials.' });
});

// Onboarding: Complete Registration
app.post('/api/onboarding/complete', (req, res) => {
  const { token, new_username, password } = req.body;
  const user = users.find(u => u.onboarding_token === token);

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (new_username) user.username = new_username;
  user.password_hash = bcrypt.hashSync(password, 10);
  user.status = 'ACTIVE';
  user.onboarding_token = null; // Invalidate token

  res.json({ success: true, message: 'Account activated successfully.' });
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
