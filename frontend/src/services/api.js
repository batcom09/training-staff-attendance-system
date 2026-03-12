import axios from 'axios';
import toast from 'react-hot-toast';

// Create base axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('authTokens'));
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = JSON.parse(localStorage.getItem('authTokens'));
        if (tokens?.refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken: tokens.refreshToken }
          );

          const newTokens = response.data.tokens;
          localStorage.setItem('authTokens', JSON.stringify(newTokens));

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('authTokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const message = error.response?.data?.error || error.message || 'An error occurred';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: (tokens) => api.post('/auth/refresh', tokens),
  verify: () => api.get('/auth/verify'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  uploadProfileImage: (formData) => api.post('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getDepartments: () => api.get('/users/departments'),
};

// Attendance API
export const attendanceAPI = {
  getTodayStatus: () => api.get('/attendance/today'),
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getHistory: (params) => api.get('/attendance/history', { params }),
  getTeamAttendance: (params) => api.get('/attendance/team', { params }),
  getAttendanceStats: (params) => api.get('/attendance/stats', { params }),
  requestCorrection: (data) => api.post('/attendance/correction', data),
  getCorrectionRequests: (params) => api.get('/attendance/corrections', { params }),
  reviewCorrectionRequest: (id, data) => api.put(`/attendance/corrections/${id}`, data),
  getQRCode: (sessionId) => api.get(`/attendance/qr/${sessionId}`),
  verifyQRCode: (qrCode, location) => api.post('/attendance/verify-qr', { qrCode, location }),
};

// Training API
export const trainingAPI = {
  getPrograms: (params) => api.get('/training/programs', { params }),
  getProgram: (id) => api.get(`/training/programs/${id}`),
  createProgram: (data) => api.post('/training/programs', data),
  updateProgram: (id, data) => api.put(`/training/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/training/programs/${id}`),
  getSessions: (params) => api.get('/training/sessions', { params }),
  getSession: (id) => api.get(`/training/sessions/${id}`),
  createSession: (data) => api.post('/training/sessions', data),
  updateSession: (id, data) => api.put(`/training/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/training/sessions/${id}`),
  enrollTrainee: (programId, traineeId) => api.post(`/training/programs/${programId}/enroll`, { traineeId }),
  unenrollTrainee: (programId, traineeId) => api.delete(`/training/programs/${programId}/enroll/${traineeId}`),
  getEnrollments: (params) => api.get('/training/enrollments', { params }),
};

// Reports API
export const reportsAPI = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getTeamReport: (params) => api.get('/reports/team', { params }),
  getDepartmentReport: (params) => api.get('/reports/department', { params }),
  exportToCSV: (params) => api.get('/reports/export/csv', { 
    params, 
    responseType: 'blob' 
  }),
  exportToPDF: (params) => api.get('/reports/export/pdf', { 
    params, 
    responseType: 'blob' 
  }),
  getDashboardStats: (params) => api.get('/reports/dashboard', { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
