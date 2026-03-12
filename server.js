const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Default to login.html for root
  let filePath = req.url === '/' ? '/login.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Get file extension
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`🎯 Tactical Operations System running at:`);
  console.log(`   � Login Portal: http://localhost:${port}`);
  console.log(`   � Command Center: http://localhost:${port}/index.html`);
  console.log(`   � Backend API: http://localhost:5001`);
  console.log(`   ⚙️  Admin Panel: http://localhost:${port}/admin-dashboard.html`);
  console.log('');
  console.log('🎮 Demo Credentials:');
  console.log(`   • Field Operator: field001 / alpha123`);
  console.log(`   • Squad Leader: squad001 / bravo456`);
  console.log(`   • Command Center: command001 / charlie789`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
