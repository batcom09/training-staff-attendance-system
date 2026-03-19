document.addEventListener('DOMContentLoaded', () => {
    // Authentication Check
    const token = localStorage.getItem('tactical_token');
    const userJson = localStorage.getItem('tactical_user');
    
    if (!token || !userJson) {
        window.location.href = '/login.html';
        return;
    }

    const user = JSON.parse(userJson);
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userLevel').textContent = user.level.toUpperCase();

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('tactical_token');
        localStorage.removeItem('tactical_user');
        window.location.href = '/login.html';
    });

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }

    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    });

    // Modal Handlers
    const scanBtn = document.getElementById('scanBtn');
    const scanModal = document.getElementById('scanModal');
    const closeScanBtn = document.getElementById('closeScanBtn');

    scanBtn.addEventListener('click', () => scanModal.classList.add('active'));
    closeScanBtn.addEventListener('click', () => scanModal.classList.remove('active'));
    scanModal.addEventListener('click', (e) => {
        if (e.target === scanModal) scanModal.classList.remove('active');
    });

    // API Integration for live data rendering
    const fetchLogs = async () => {
        const feed = document.getElementById('activityFeed');
        feed.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i data-lucide="loader" class="animate-spin" style="margin-bottom: 12px; display: inline-block;"></i><br>Connecting to server...</div>';
        lucide.createIcons();

        try {
            const response = await fetch('/api/attendance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                renderLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            feed.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--danger);">Failed to sync with command center. Retrying...</div>';
        }
    };

    const renderLogs = (logs) => {
        const feed = document.getElementById('activityFeed');
        if (!logs || logs.length === 0) {
            feed.innerHTML = '<div style="padding: 32px; text-align: center; color: var(--text-muted);">No recent tactical activity.</div>';
            return;
        }

        feed.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div style="padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05);">
                    <i data-lucide="${log.status === 'success' ? 'check-circle' : 'info'}" style="color: ${log.status === 'success' ? 'var(--primary)' : 'var(--text-muted)'}; width: 20px; height: 20px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.95rem;">${log.user}</div>
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${log.action}</div>
                </div>
                <div style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px;">${log.time}</div>
            </div>
        `).join('');
        lucide.createIcons();
    };

    // Initial load
    fetchLogs();
});
