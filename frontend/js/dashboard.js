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

    // Navigation Menu Logic
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active styling
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update title
            pageTitle.textContent = item.querySelector('.sidebar-text').textContent;

            // Toggle views
            const targetViewId = 'view-' + item.dataset.view;
            views.forEach(view => {
                if (view.id === targetViewId) {
                    view.style.display = 'block';
                    // Trigger a brief fade animation
                    view.style.opacity = '0';
                    setTimeout(() => view.style.opacity = '1', 10);
                    view.style.transition = 'opacity 0.3s ease';
                    
                    if(item.dataset.view === 'settings') {
                        loadUsers();
                    }
                } else {
                    view.style.display = 'none';
                }
            });
        });
    });

    // User Management Logic
    const loadUsers = async () => {
        if (user.level !== 'admin') {
            document.getElementById('adminWarning').style.display = 'block';
            document.getElementById('showAddUserModalBtn').style.display = 'none';
            document.getElementById('squadManagementContent').style.display = 'none';
            return;
        }

        document.getElementById('adminWarning').style.display = 'none';
        document.getElementById('showAddUserModalBtn').style.display = 'inline-flex';
        document.getElementById('squadManagementContent').style.display = 'block';

        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            if (data.success) {
                renderUsersTable(data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const renderUsersTable = (usersData) => {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = usersData.map(u => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 16px 12px; font-family: monospace;">${u.id}</td>
                <td style="padding: 16px 12px; font-weight: 500;">${u.name}</td>
                <td style="padding: 16px 12px;">
                    <span style="padding: 4px 8px; background: rgba(76,175,80,0.1); border: 1px solid rgba(76,175,80,0.3); border-radius: 4px; font-size: 0.75rem; color: var(--accent); text-transform: uppercase;">
                        ${u.level}
                    </span>
                </td>
                <td style="padding: 16px 12px; text-align: right;">
                    <button class="delete-user-btn" data-id="${u.id}" ${u.id === user.id ? 'disabled title="Cannot delete self"' : 'title="Revoke Access"'} style="background: none; border: none; color: ${u.id === user.id ? 'var(--text-muted)' : 'var(--danger)'}; cursor: ${u.id === user.id ? 'not-allowed' : 'pointer'}; padding: 6px; border-radius: 6px; transition: background 0.2s;">
                        <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if(confirm(`Are you sure you want to revoke access for ${id}?`)) {
                    try {
                        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
                        if(res.ok) loadUsers();
                    } catch(err) {
                        console.error('Error deleting user', err);
                    }
                }
            });
        });
    };

    // Add user modal handlers
    const addUserModal = document.getElementById('addUserModal');
    const addUserError = document.getElementById('addUserError');
    document.getElementById('showAddUserModalBtn').addEventListener('click', () => {
        addUserModal.classList.add('active');
        addUserError.classList.remove('visible');
    });
    document.getElementById('closeAddUserBtn').addEventListener('click', () => {
        addUserModal.classList.remove('active');
    });
    addUserModal.addEventListener('click', (e) => {
        if (e.target === addUserModal) addUserModal.classList.remove('active');
    });
    
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        addUserError.classList.remove('visible');
        const payload = {
            name: document.getElementById('newUserName').value,
            id: document.getElementById('newUserPersonnelId').value,
            code: document.getElementById('newUserCode').value,
            level: document.getElementById('newUserLevel').value
        };

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                addUserModal.classList.remove('active');
                e.target.reset();
                loadUsers();
            } else {
                addUserError.textContent = data.message || 'Registration failed.';
                addUserError.classList.add('visible');
            }
        } catch (error) {
            console.error('Error adding user', error);
            addUserError.textContent = 'Server connection error.';
            addUserError.classList.add('visible');
        }
    });

    // Initial load
    fetchLogs();
});
