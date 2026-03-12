/**
 * Render Pinger - Keeps your app awake and prevents sleep
 * This will ping your app every 14 minutes (Render sleeps after 15 min of inactivity)
 */

const https = require('https');
const http = require('http');

// Your app URLs (update these after deployment)
const APP_URLS = [
    'https://your-app-name.onrender.com',
    'https://your-app-name.onrender.com/index.html',
    'https://your-app-name.onrender.com/admin-dashboard.html'
];

// Ping function
function pingUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, (res) => {
            console.log(`✅ ${url} - Status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.log(`❌ ${url} - Error: ${err.message}`);
            resolve(false);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`⏰ ${url} - Timeout`);
            resolve(false);
        });

        req.end();
    });
}

// Main ping function
async function pingAllUrls() {
    console.log(`🔄 Pinging ${APP_URLS.length} URLs - ${new Date().toISOString()}`);
    
    const results = await Promise.allSettled(APP_URLS.map(pingUrl));
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`📊 Success: ${successful}/${APP_URLS.length} URLs pinged successfully`);
    console.log('⏳ Next ping in 14 minutes...\n');
}

// Start pinger
console.log('🚀 Render Pinger Started');
console.log('⚠️  Update APP_URLS in pinger.js with your actual deployment URLs');
console.log('🔄 Pinging every 14 minutes to prevent sleep...\n');

// Initial ping
pingAllUrls();

// Set interval for 14 minutes (840,000 ms)
setInterval(pingAllUrls, 14 * 60 * 1000);

// Optional: Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Pinger stopped');
    process.exit(0);
});
