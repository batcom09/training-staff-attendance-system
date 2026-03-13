const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

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
  // Add timestamp to logs
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint for Render and monitoring
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: timestamp,
      uptime: process.uptime(),
      service: 'Tactical Operations System',
      version: '2.0.1'
    }));
    return;
  }

  // Keep-alive endpoint for pinger
  if (req.url === '/keep-alive' || req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'System is awake and operational',
      timestamp: timestamp,
      status: 'active'
    }));
    return;
  }

  // Default to login.html for root
  let filePath = req.url === '/' ? '/login.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Security check - prevent directory traversal
  if (!filePath.startsWith(path.join(__dirname))) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 - Access Denied</h1>', 'utf-8');
    return;
  }

  // Get file extension
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - serve 404 page
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Page Not Found</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                background: #0a0e0a; 
                color: #4caf50; 
                text-align: center; 
                padding: 50px;
                margin: 0;
              }
              h1 { font-size: 4em; margin-bottom: 20px; }
              p { font-size: 1.2em; margin: 20px 0; }
              a { color: #8bc34a; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404</h1>
            <p>Page Not Found</p>
            <p>The requested tactical resource could not be located.</p>
            <a href="/login.html">Return to Login Portal</a>
          </body>
          </html>
        `, 'utf-8');
      } else {
        // Server error
        console.error(`Server Error: ${err.code} - ${filePath}`);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>500 - Server Error</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                background: #0a0e0a; 
                color: #ff5252; 
                text-align: center; 
                padding: 50px;
                margin: 0;
              }
              h1 { font-size: 4em; margin-bottom: 20px; }
              p { font-size: 1.2em; margin: 20px 0; }
              a { color: #8bc34a; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>500</h1>
            <p>System Error</p>
            <p>A tactical system error has occurred.</p>
            <a href="/login.html">Return to Login Portal</a>
          </body>
          </html>
        `, 'utf-8');
      }
    } else {
      // Success - add cache control for static assets
      if (extname === '.js' || extname === '.css' || extname === '.png' || extname === '.jpg' || extname === '.gif' || extname === '.svg' || extname === '.ico') {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // No cache for HTML
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(port, () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const environment = isProduction ? 'Production' : 'Development';

  console.log('='.repeat(60));
  console.log(`🎯 Tactical Operations System v2.0.1 - ${environment}`);
  console.log(`🚀 Server running on port ${port}`);
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log(`   🌐 Login Portal: http://localhost:${port}`);
  console.log(`   🎮 Command Center: http://localhost:${port}/index.html`);
  console.log(`   ⚙️  Admin Panel: http://localhost:${port}/admin-dashboard.html`);
  console.log(`   💓 Health Check: http://localhost:${port}/health`);
  console.log(`   🔄 Keep-Alive: http://localhost:${port}/keep-alive`);
  console.log('');
  console.log('🎮 Demo Credentials:');
  console.log(`   • Field Operator: field001 / alpha123`);
  console.log(`   • Squad Leader: squad001 / bravo456`);
  console.log(`   • Command Center: command001 / charlie789`);
  console.log('');
  console.log('🔧 System Features:');
  console.log('   • Enhanced security headers');
  console.log('   • Health monitoring endpoints');
  console.log('   • Keep-alive for Render deployment');
  console.log('   • Graceful shutdown handling');
  console.log('   • Error pages with military theme');
  console.log('='.repeat(60));
});
