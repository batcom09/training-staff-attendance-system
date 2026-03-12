/**
 * System Protection & Resilience Manager
 * Prevents system breakage from adjustments and provides fallbacks
 */

class SystemProtection {
    constructor() {
        this.isHealthy = true;
        this.errorCount = 0;
        this.maxErrors = 10;
        this.fallbackMode = false;
        this.lastKnownGoodState = {};
        this.init();
    }

    init() {
        // Store initial good state
        this.captureGoodState();
        
        // Set up global error handlers
        this.setupErrorHandlers();
        
        // Monitor critical elements
        this.monitorCriticalElements();
        
        // Set up health checks
        this.startHealthChecks();
        
        console.log('🛡️ System Protection Initialized');
    }

    captureGoodState() {
        // Store critical HTML structures
        const criticalElements = [
            'mainContent', 'sidebar', 'scannerModal', 
            'profileDropdown', 'activityFeed'
        ];
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.lastKnownGoodState[id] = {
                    html: element.outerHTML,
                    display: element.style.display,
                    className: element.className
                };
            }
        });
    }

    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'JavaScript Error');
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
                this.handleError(new Error(`Failed to load: ${event.target.src || event.target.href}`), 'Resource Error');
            }
        }, true);
    }

    handleError(error, type) {
        this.errorCount++;
        console.error(`❌ ${type}:`, error);
        
        // Check if we need fallback mode
        if (this.errorCount >= this.maxErrors || this.fallbackMode) {
            this.activateFallbackMode();
        }
        
        // Try to recover
        this.attemptRecovery(type, error);
    }

    monitorCriticalElements() {
        // Monitor main content area
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mainContent.children.length === 0) {
                        console.warn('⚠️ Main content cleared unexpectedly - restoring...');
                        this.restoreMainContent();
                    }
                });
            });
            
            observer.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }
    }

    startHealthChecks() {
        // Check system health every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
    }

    performHealthCheck() {
        const checks = [
            this.checkMainContent(),
            this.checkNavigation(),
            this.checkModals(),
            this.checkStyles()
        ];
        
        const passed = checks.filter(check => check.passed).length;
        const total = checks.length;
        
        this.isHealthy = passed === total;
        
        if (!this.isHealthy) {
            console.warn(`⚠️ Health check failed: ${passed}/${total} checks passed`);
            this.attemptAutoRepair();
        } else {
            console.log(`✅ Health check passed: ${passed}/${total} checks passed`);
        }
    }

    checkMainContent() {
        const mainContent = document.getElementById('mainContent');
        return {
            name: 'Main Content',
            passed: mainContent && mainContent.children.length > 0,
            element: mainContent
        };
    }

    checkNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        return {
            name: 'Navigation',
            passed: navItems.length > 0,
            element: navItems[0]
        };
    }

    checkModals() {
        const modals = document.querySelectorAll('[id$="Modal"]');
        return {
            name: 'Modals',
            passed: modals.length >= 2, // At least scanner and success modals
            element: modals[0]
        };
    }

    checkStyles() {
        const testElement = document.createElement('div');
        testElement.className = 'glassmorphism';
        document.body.appendChild(testElement);
        const styles = window.getComputedStyle(testElement);
        const hasBackdrop = styles.backdropFilter !== 'none';
        document.body.removeChild(testElement);
        
        return {
            name: 'Styles',
            passed: hasBackdrop,
            element: testElement
        };
    }

    activateFallbackMode() {
        if (this.fallbackMode) return;
        
        console.warn('🚨 ACTIVATING FALLBACK MODE');
        this.fallbackMode = true;
        
        // Disable complex animations
        document.body.classList.add('fallback-mode');
        
        // Restore last known good state
        this.restoreGoodState();
        
        // Show notification
        this.showNotification('System running in safe mode - Some features may be limited', 'warning');
    }

    restoreGoodState() {
        Object.keys(this.lastKnownGoodState).forEach(id => {
            const element = document.getElementById(id);
            const state = this.lastKnownGoodState[id];
            
            if (element && state) {
                try {
                    element.outerHTML = state.html;
                    element.style.display = state.display;
                    element.className = state.className;
                } catch (error) {
                    console.error(`Failed to restore ${id}:`, error);
                }
            }
        });
        
        // Reinitialize icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
        }
    }

    attemptRecovery(type, error) {
        console.log(`🔄 Attempting recovery from: ${type}`);
        
        switch(type) {
            case 'JavaScript Error':
                this.recoverFromScriptError(error);
                break;
            case 'Resource Error':
                this.recoverFromResourceError(error);
                break;
            case 'Main Content Error':
                this.restoreMainContent();
                break;
            default:
                this.generalRecovery();
        }
    }

    recoverFromScriptError(error) {
        // Try to reload critical scripts
        const criticalScripts = [
            'https://unpkg.com/lucide@latest',
            'https://unpkg.com/@zxing/library@latest'
        ];
        
        criticalScripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => console.log(`✅ Reloaded: ${src}`);
            script.onerror = () => console.error(`❌ Failed to reload: ${src}`);
            document.head.appendChild(script);
        });
    }

    recoverFromResourceError(error) {
        // Try to reload CSS
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            if (link.href.includes('tailwind') || link.href.includes('fonts')) {
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = link.href;
                newLink.onload = () => console.log(`✅ Reloaded CSS: ${link.href}`);
                document.head.appendChild(newLink);
            }
        });
    }

    restoreMainContent() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent && mainContent.children.length === 0) {
            // Load default dashboard
            if (typeof showDashboard === 'function') {
                showDashboard();
            } else {
                mainContent.innerHTML = `
                    <div class="p-6 text-center">
                        <h2 class="text-2xl font-bold text-white mb-4">System Recovery</h2>
                        <p class="text-gray-400">Main content restored. Please refresh if needed.</p>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }

    generalRecovery() {
        // General recovery - reset to safe state
        console.log('🔄 Performing general system recovery...');
        
        // Clear any problematic intervals/timeouts
        const highestId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Reinitialize critical functions
        setTimeout(() => {
            this.captureGoodState();
            this.isHealthy = true;
            this.errorCount = 0;
            console.log('✅ System recovery completed');
        }, 1000);
    }

    attemptAutoRepair() {
        console.log('🔧 Attempting automatic repairs...');
        
        // Check and fix common issues
        this.fixMissingIcons();
        this.fixBrokenStyles();
        this.fixEventListeners();
        this.fixLocalStorage();
    }

    fixMissingIcons() {
        if (typeof lucide !== 'undefined') {
            // Find all icon placeholders
            const iconPlaceholders = document.querySelectorAll('[data-lucide]:not(.lucide)');
            if (iconPlaceholders.length > 0) {
                console.log(`🔧 Fixing ${iconPlaceholders.length} missing icons`);
                lucide.createIcons();
            }
        }
    }

    fixBrokenStyles() {
        // Ensure critical styles are present
        const testElement = document.createElement('div');
        testElement.className = 'glassmorphism';
        document.body.appendChild(testElement);
        
        const styles = window.getComputedStyle(testElement);
        if (styles.backdropFilter === 'none') {
            console.log('🔧 Reapplying broken styles');
            this.injectFallbackStyles();
        }
        
        document.body.removeChild(testElement);
    }

    fixEventListeners() {
        // Reattach critical event listeners
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (!item.hasAttribute('data-listener')) {
                item.addEventListener('click', this.handleNavClick.bind(this));
                item.setAttribute('data-listener', 'true');
            }
        });
    }

    fixLocalStorage() {
        // Check localStorage availability
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            console.warn('⚠️ localStorage not available, using fallback');
            this.localStorageFallback = {};
        }
    }

    injectFallbackStyles() {
        const fallbackCSS = `
            .glassmorphism {
                background: rgba(255, 255, 255, 0.05) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            }
            .fallback-mode * {
                animation: none !important;
                transition: none !important;
                transform: none !important;
            }
            .nav-item:hover {
                background: rgba(76, 175, 80, 0.2) !important;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = fallbackCSS;
        document.head.appendChild(styleElement);
    }

    handleNavClick(event) {
        try {
            const navType = event.currentTarget.dataset.nav;
            if (navType && typeof window[`show${navType.charAt(0).toUpperCase() + navType.slice(1)}`] === 'function') {
                window[`show${navType.charAt(0).toUpperCase() + navType.slice(1)}`]();
            }
        } catch (error) {
            console.error('Navigation error:', error);
            this.restoreMainContent();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-lucide="${type === 'warning' ? 'alert-triangle' : 'info'}" class="w-5 h-5"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Initialize icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    getSystemStatus() {
        return {
            healthy: this.isHealthy,
            errorCount: this.errorCount,
            fallbackMode: this.fallbackMode,
            lastCheck: new Date().toISOString()
        };
    }
}

// Initialize system protection
let systemProtection;
document.addEventListener('DOMContentLoaded', () => {
    systemProtection = new SystemProtection();
    
    // Make it globally available
    window.systemProtection = systemProtection;
    
    // Add system status to console
    console.log('🛡️ System Protection Active');
    console.log('💡 Type systemProtection.getSystemStatus() for status');
});
