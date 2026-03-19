const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = { userId: 'trainee-id' };
const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
const token = jwt.sign(payload, secret);

console.log('Verification Token:', token);
