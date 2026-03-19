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
    
    // Hide scan button for non-admins
    document.getElementById('scanBtn').style.display = user.level === 'admin' ? 'inline-flex' : 'none';

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

    let html5QrcodeScanner = null;

    scanBtn.addEventListener('click', () => {
        scanModal.classList.add('active');
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText, decodedResult) => {
                // handle scan
                html5QrcodeScanner.stop();
                scanModal.classList.remove('active');
                try {
                    const res = await fetch('/api/attendance/scan', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ scannedData: decodedText })
                    });
                    const data = await res.json();
                    if(data.success) {
                        alert('Scan successful for: ' + data.user);
                        fetchLogs();
                    } else {
                        alert('Scan failed: ' + data.message);
                    }
                } catch(e) {
                    console.error('Scan api error', e);
                }
            },
            (errorMessage) => {
                // parse error, keep scanning
            }
        ).catch((err) => {
            console.log("Scanner start failed", err);
        });
    });

    closeScanBtn.addEventListener('click', () => {
        scanModal.classList.remove('active');
        if(html5QrcodeScanner) {
            html5QrcodeScanner.stop().catch(err => console.log(err));
        }
    });

    scanModal.addEventListener('click', (e) => {
        if (e.target === scanModal) {
            scanModal.classList.remove('active');
            if(html5QrcodeScanner) {
                html5QrcodeScanner.stop().catch(err => console.log(err));
            }
        }
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

    // Role-based visibility
    const allowedViews = {
        admin: ['dashboard', 'attendance', 'training', 'messages', 'settings'],
        command: ['dashboard', 'attendance', 'training', 'messages'],
        field: ['profile', 'messages']
    };

    navItems.forEach(item => {
        const view = item.dataset.view;
        if (!allowedViews[user.level].includes(view)) {
            item.style.display = 'none';
        }
    });

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
                    } else if (item.dataset.view === 'messages') {
                        loadMessages();
                    } else if (item.dataset.view === 'profile') {
                        loadProfile();
                    }
                } else {
                    view.style.display = 'none';
                }
            });
        });
    });

    // Determine initial view based on role
    const initialView = user.level === 'field' ? 'profile' : 'dashboard';
    const initBtn = document.querySelector(`.nav-item[data-view="${initialView}"]`);
    if(initBtn) {
        initBtn.click();
    } else {
        // Fallback for safety
        navItems.forEach(n => n.classList.remove('active'));
        views.forEach(v => v.style.display = 'none');
        document.getElementById('view-dashboard').style.display = 'block';
    }

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
                <td style="padding: 16px 12px;">
                    <span style="padding: 4px 8px; background: ${u.status === 'pending' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'}; border: 1px solid ${u.status === 'pending' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'}; border-radius: 4px; font-size: 0.75rem; color: ${u.status === 'pending' ? '#ff9800' : 'var(--accent)'}; text-transform: uppercase;">
                        ${u.status || 'unknown'}
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

    // Messaging Functionality
    const loadMessages = async () => {
        try {
            const res = await fetch('/api/messages');
            const data = await res.json();
            if (data.success) {
                const list = document.getElementById('messagesList');
                if (!data.messages || data.messages.length === 0) {
                    list.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:24px;">No secure messages broadcasted.</div>';
                } else {
                    list.innerHTML = data.messages.map(m => `
                        <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px; border-left: 4px solid var(--primary);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <span style="font-weight:600; color:var(--primary); font-size: 0.95rem;">${m.sender}</span>
                                <span style="font-size:0.75rem; color:var(--text-muted); padding:2px 6px; background:rgba(0,0,0,0.3); border-radius:4px;">${m.time}</span>
                            </div>
                            <div style="color:var(--text-main); font-size:0.95rem; line-height: 1.5;">${m.content}</div>
                        </div>
                    `).join('');
                }
            }
        } catch(e) { console.error('Error loading messages:', e); }
    };

    const broadcastMsgBtn = document.getElementById('broadcastMsgBtn');
    if (user.level === 'command' || user.level === 'admin') {
        broadcastMsgBtn.style.display = 'inline-flex';
        broadcastMsgBtn.addEventListener('click', async () => {
            const msg = prompt('Enter priority message to broadcast to all operatives:');
            if(msg) {
                try {
                    await fetch('/api/messages', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ sender: user.level.toUpperCase() + ' (' + user.name + ')', content: msg })
                    });
                    loadMessages();
                } catch(e) { console.error('Failed to broadcast', e); }
            }
        });
    }

    // Profile Functionality
    const loadProfile = () => {
        if(user.profile) {
            document.getElementById('profDisplayBlood').textContent = user.profile.bloodType;
            document.getElementById('profDisplayEmergency').textContent = user.profile.emergencyContact;
            document.getElementById('profDisplayBackground').textContent = user.profile.background;
            
            const qrImg = document.getElementById('qrCodeImg');
            const qrLoading = document.getElementById('qrLoading');
            qrLoading.style.display = 'none';
            qrImg.style.display = 'inline-block';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(user.id)}&color=000000&bgcolor=ffffff`;
        } else if(user.level === 'field') {
            document.getElementById('profileModal').classList.add('active');
        }
    };

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const bloodType = document.getElementById('profInputBlood').value;
        const emergencyContact = document.getElementById('profInputEmergency').value;
        const background = document.getElementById('profInputBackground').value;
        
        try {
            const res = await fetch('/api/users/profile', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId: user.id, bloodType, emergencyContact, background })
            });
            const data = await res.json();
            if(data.success) {
                user.profile = data.user.profile;
                localStorage.setItem('tactical_user', JSON.stringify(user));
                document.getElementById('profileModal').classList.remove('active');
                loadProfile();
            }
        } catch(e) { console.error('Failed to save profile', e); }
    });

    if (user.level === 'field' && !user.profile) {
        document.getElementById('profileModal').classList.add('active');
    }

    // Initial load for dashboard if visible
    if(allowedViews[user.level].includes('dashboard')) {
        fetchLogs();
    }
});
