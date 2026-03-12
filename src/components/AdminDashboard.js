import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Search, Bell, User, Moon, Sun, Monitor, 
  QrCode, Users, BarChart3, Package, Settings, HelpCircle,
  Home, ChevronRight, Download, Share2, Copy, Flashlight,
  Camera, ZoomIn, ZoomOut, Activity, TrendingUp, UserPlus,
  Filter, MoreVertical, Calendar, MapPin, Clock, CheckCircle,
  AlertCircle, XCircle, RefreshCw, Grid, List
} from 'lucide-react';

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [cameraPermission, setCameraPermission] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Mock data
  const stats = {
    totalUsers: 2487,
    activeUsers: 1842,
    scansToday: 342,
    revenue: 45678
  };

  const notifications = [
    { id: 1, type: 'success', message: 'QR scan completed successfully', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Camera permission required', time: '5 min ago' },
    { id: 3, type: 'info', message: 'New user registration', time: '1 hour ago' }
  ];

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'Scanned QR Code', time: '2 min ago', status: 'success' },
    { id: 2, user: 'Jane Smith', action: 'Updated profile', time: '15 min ago', status: 'info' },
    { id: 3, user: 'Bob Johnson', action: 'Exported report', time: '1 hour ago', status: 'success' }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Home },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode, highlight: true },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory/Asset Tracking', icon: Package },
    { id: 'settings', label: 'Settings & Configuration', icon: Settings },
    { id: 'help', label: 'Help Center', icon: HelpCircle }
  ];

  useEffect(() => {
    // Initialize camera when scanner is active
    if (scannerActive && videoRef.current) {
      initializeCamera();
    }
  }, [scannerActive]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraPermission(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraPermission(false);
    }
  };

  const handleScan = (result) => {
    const newScan = {
      id: Date.now(),
      data: result,
      timestamp: new Date(),
      location: 'Office Building A'
    };
    setScanHistory([newScan, ...scanHistory]);
    // Play success sound
    playBeep();
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );

  const ActivityFeed = ({ activity }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className={`w-2 h-2 rounded-full ${
        activity.status === 'success' ? 'bg-emerald-400' :
        activity.status === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
      }`} />
      <div className="flex-1">
        <p className="text-sm text-gray-300">{activity.user} {activity.action}</p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-500" />
    </div>
  );

  const QRScanner = () => (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-4">
        {/* Scanner Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">QR Code Scanner</h3>
          <button
            onClick={() => setScannerActive(false)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Scanner Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-white/30 rounded-xl" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
            </div>
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFlashlightOn(!flashlightOn)}
                className={`p-3 rounded-lg ${flashlightOn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white'} transition-colors`}
              >
                <Flashlight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                className="p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                className="p-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <div className="text-white text-sm">
              Zoom: {zoom}x
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <input
            type="text"
            placeholder="Manual entry for damaged codes..."
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col`}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-white font-semibold">NexusAdmin Pro</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isHighlighted = item.highlight;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                if (item.id === 'scanner') setScannerActive(true);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${isHighlighted && !isActive ? 'animate-pulse' : ''}`}
            >
              <Icon className={`w-5 h-5 ${isHighlighted ? 'text-blue-400' : ''}`} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const TopBar = () => (
    <div className="h-16 bg-slate-900/30 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-full flex items-center space-x-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm">Search or press Cmd+K...</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <div className="flex items-center space-x-1 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded ${theme === 'light' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded ${theme === 'dark' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('auto')}
            className={`p-1.5 rounded ${theme === 'auto' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const MainContent = () => (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.totalUsers} change={12.5} icon={Users} color="blue" />
        <StatCard title="Active Users" value={stats.activeUsers} change={8.2} icon={Activity} color="emerald" />
        <StatCard title="Scans Today" value={stats.scansToday} change={23.1} icon={QrCode} color="purple" />
        <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} change={15.3} icon={TrendingUp} color="yellow" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
            </div>
          </div>
          <div className="p-6 space-y-2">
            {recentActivity.map((activity) => (
              <ActivityFeed key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => setScannerActive(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>Start QR Scanner</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
              <UserPlus className="w-5 h-5" />
              <span>Invite User</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <BarChart3 className="w-12 h-12" />
            <span className="ml-2">Chart visualization here</span>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Activity</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <Activity className="w-12 h-12" />
            <span className="ml-2">Activity chart here</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <MainContent />
        </div>
      </div>

      {/* QR Scanner Modal */}
      {scannerActive && <QRScanner />}

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl mx-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, scans, reports..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                  autoFocus
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
              <div className="text-sm text-gray-400">
                Press <kbd className="px-2 py-1 bg-white/10 rounded">Cmd+K</kbd> to open search
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
