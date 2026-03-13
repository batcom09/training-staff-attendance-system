/**
 * Render Pinger - Keeps your app awake and prevents sleep
 * This will ping your app every 14 minutes (Render sleeps after 15 min of inactivity)
 */

const https = require('https');
const http = require('http');

// Your app URLs (update these after deployment)
const APP_URLS = [
    'https://military-training-system.onrender.com',
    'https://military-training-system.onrender.com/login.html',
    'https://military-training-system.onrender.com/index.html',
    'https://military-training-system.onrender.com/admin-dashboard.html'
];

// Enhanced ping function with retry logic
function pingUrl(url, retries = 3) {
    return new Promise((resolve) => {
        const attemptPing = (attempt) => {
            const protocol = url.startsWith('https') ? https : http;

            const req = protocol.get(url, (res) => {
                console.log(`✅ ${url} - Status: ${res.statusCode} (Attempt ${attempt})`);
                resolve(true);
            });

            req.on('error', (err) => {
                console.log(`❌ ${url} - Error: ${err.message} (Attempt ${attempt})`);
                if (attempt < retries) {
                    console.log(`🔄 Retrying ${url} in 5 seconds...`);
                    setTimeout(() => attemptPing(attempt + 1), 5000);
                } else {
                    resolve(false);
                }
            });

            req.setTimeout(15000, () => {
                req.destroy();
                console.log(`⏰ ${url} - Timeout (Attempt ${attempt})`);
                if (attempt < retries) {
                    console.log(`🔄 Retrying ${url} in 5 seconds...`);
                    setTimeout(() => attemptPing(attempt + 1), 5000);
                } else {
                    resolve(false);
                }
            });

            req.end();
        };

        attemptPing(1);
    });
}

// Main ping function with better logging
async function pingAllUrls() {
    console.log(`🔄 Pinging ${APP_URLS.length} URLs - ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    const results = await Promise.allSettled(APP_URLS.map(url => pingUrl(url)));
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value).length;

    console.log('='.repeat(60));
    console.log(`📊 Success: ${successful}/${APP_URLS.length} URLs pinged successfully`);
    if (failed > 0) {
        console.log(`❌ Failed: ${failed}/${APP_URLS.length} URLs failed to respond`);
    }
    console.log('⏳ Next ping in 14 minutes...\n');

    return { successful, failed, total: APP_URLS.length };
}

// Health check function
async function healthCheck() {
    const results = await pingAllUrls();

    // Log overall health status
    if (results.failed === 0) {
        console.log('🟢 All systems operational - App is healthy and awake!');
    } else if (results.failed < results.total / 2) {
        console.log('🟡 Some services may be slow - App is partially responsive');
    } else {
        console.log('🔴 Multiple services failing - App may be asleep or having issues');
    }

    return results;
}

// Start pinger
console.log('🚀 Render Pinger Started');
console.log('🎯 Target URLs:');
APP_URLS.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
});
console.log('');
console.log('⏰ Pinging every 14 minutes to prevent Render sleep');
console.log('🔄 Enhanced with retry logic and health monitoring');
console.log('='.repeat(60));

// Initial health check
healthCheck();

// Set interval for 14 minutes (840,000 ms)
setInterval(healthCheck, 14 * 60 * 1000);

// Optional: Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Pinger stopped gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Pinger terminated');
    process.exit(0);
});
