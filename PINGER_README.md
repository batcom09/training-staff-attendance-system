# 🔄 Render Pinger - Keep Your App Awake

## Purpose
This pinger prevents your Render deployment from sleeping by sending HTTP requests every 14 minutes. Render's free tier puts apps to sleep after 15 minutes of inactivity.

## 🚀 Quick Setup

### 1. Update URLs in `pinger.js`
```javascript
const APP_URLS = [
    'https://your-app-name.onrender.com',
    'https://your-app-name.onrender.com/index.html',
    'https://your-app-name.onrender.com/admin-dashboard.html'
];
```

### 2. Run the Pinger
```bash
npm run pinger
```

## 📋 Features

- ✅ **Auto-ping every 14 minutes** (prevents 15-min sleep)
- ✅ **Multiple URL support** - pings all your app pages
- ✅ **Error handling** - continues even if some pings fail
- ✅ **Detailed logging** - shows success/failure status
- ✅ **Graceful shutdown** - handles Ctrl+C properly
- ✅ **Timeout protection** - 10-second timeout per request

## 🖥️ Console Output Example
```
🚀 Render Pinger Started
⚠️  Update APP_URLS in pinger.js with your actual deployment URLs
🔄 Pinging every 14 minutes to prevent sleep...

🔄 Pinging 3 URLs - 2026-03-12T10:30:00.000Z
✅ https://your-app-name.onrender.com - Status: 200
✅ https://your-app-name.onrender.com/index.html - Status: 200
✅ https://your-app-name.onrender.com/admin-dashboard.html - Status: 200
📊 Success: 3/3 URLs pinged successfully
⏳ Next ping in 14 minutes...
```

## 🛠️ Deployment Options

### Option 1: Local Machine (Recommended for Development)
Run pinger on your local machine:
```bash
npm run pinger
```

### Option 2: External Service (Recommended for Production)
Use a free cron job service like:
- **Cron-job.org** - Free cron jobs
- **EasyCron** - Free tier available
- **UptimeRobot** - Free monitoring service

### Option 3: GitHub Actions (Advanced)
Create `.github/workflows/pinger.yml`:
```yaml
name: Keep App Awake
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install && npm run pinger
```

## ⚙️ Configuration

### Custom Ping Interval
Edit the interval in `pinger.js`:
```javascript
// Change 14 to any number of minutes
setInterval(pingAllUrls, 14 * 60 * 1000);
```

### Add More URLs
Simply add more URLs to the array:
```javascript
const APP_URLS = [
    'https://your-app-name.onrender.com',
    'https://your-app-name.onrender.com/api/health',
    'https://your-app-name.onrender.com/admin-dashboard.html'
];
```

## 🔍 Troubleshooting

### Common Issues:
1. **"Connection refused"** - App is not running or URL is wrong
2. **"Timeout"** - App is slow or network issues
3. **"404 Not Found"** - Check URL paths are correct

### Solutions:
- Verify your app is deployed and running
- Check URLs match your actual Render deployment
- Ensure your app responds to GET requests
- Monitor Render logs for any errors

## 📞 Support

This pinger is designed specifically for your Military Training Attendance System. It ensures:
- Login page stays responsive
- Main dashboard remains accessible  
- Admin dashboard doesn't sleep
- QR scanner functionality is always ready

**Keep your military training system 24/7 operational!** 🎯
