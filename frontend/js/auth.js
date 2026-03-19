document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const loginCard = document.getElementById('loginCard');
    const submitBtn = document.getElementById('loginSubmitBtn');

    // Check if already logged in
    if (localStorage.getItem('tactical_token')) {
        window.location.href = '/index.html';
        return;
    }

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', () => {
        const icon = togglePasswordBtn.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            passwordInput.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        loginError.classList.remove('visible');
        loginCard.classList.remove('animate-shake');
        
        submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width: 20px; height: 20px;"></i> Connecting...';
        lucide.createIcons();
        submitBtn.style.opacity = '0.8';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Success animation
                loginCard.classList.add('success-flash');
                submitBtn.innerHTML = '<i data-lucide="check" style="width: 20px; height: 20px;"></i> Connection Established';
                submitBtn.style.background = 'var(--primary)';
                lucide.createIcons();
                
                // Store auth
                localStorage.setItem('tactical_token', data.token);
                localStorage.setItem('tactical_user', JSON.stringify(data.user));
                
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            } else {
                showError(data.message || 'Invalid credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Server connection failed. Attempting reconnect...');
        }
    });

    function showError(msg) {
        loginError.textContent = msg;
        loginError.classList.add('visible');
        loginCard.classList.add('animate-shake');
        
        submitBtn.innerHTML = '<i data-lucide="log-in" style="width: 20px; height: 20px;"></i> Log In';
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
        lucide.createIcons();

        setTimeout(() => {
            loginCard.classList.remove('animate-shake');
        }, 500);
    }
});
