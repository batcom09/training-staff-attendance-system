# Training Staff Attendance Management System (MVP)

A comprehensive web-based attendance management system for training staff with role-based access, streamlined check-in/out workflows, and intuitive UI/UX design.

## 🚀 Features

### Core Functionality
- **Role-based Access Control**: Admin, Supervisor, and Trainee roles with specific permissions
- **Attendance Management**: QR code scanning, geolocation verification, and manual check-in/out
- **Real-time Dashboard**: Role-specific dashboards with live attendance status
- **Training Programs**: Complete training session and program management
- **Reporting & Analytics**: Comprehensive reports with CSV/PDF export capabilities
- **Profile Management**: User profiles with Cloudinary image integration
- **Notification System**: Real-time alerts and reminders via WebSockets

### User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Admin** | Full system access: manage staff, view all reports, configure training schedules, export data, system settings |
| **Supervisor** | View assigned trainees' attendance, approve corrections, generate team reports, mark attendance for group sessions |
| **Trainee** | Self check-in/out, view personal attendance history, request corrections, receive notifications |

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management
- **React Hot Toast** - Notification system

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Socket.IO** - Real-time communication
- **Cloudinary** - Image storage
- **Winston** - Logging

### Development Tools
- **Nodemon** - Auto-restart server
- **Concurrently** - Run multiple scripts
- **Joi** - Input validation
- **Bcrypt** - Password hashing

## 📋 Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd training-attendance-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, backend, frontend)
npm run install-all
```

### 3. Database Setup

#### PostgreSQL Setup
```bash
# Create database
createdb training_attendance

# Or use psql
psql
CREATE DATABASE training_attendance;
```

#### Environment Configuration
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit the .env file with your database credentials
nano backend/.env
```

#### Run Migrations
```bash
cd backend
npm run migrate
```

#### Seed Database (Optional)
```bash
npm run seed
```

### 4. Start Development Servers

#### Method 1: Using Root Script (Recommended)
```bash
npm run dev
```
This will start both backend and frontend servers concurrently.

#### Method 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔐 Default Login Credentials

After running the seed script, you can use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@training.com | admin123 |
| Supervisor | supervisor@training.com | supervisor123 |
| Trainee | trainee1@training.com | trainee123 |
| Trainee | trainee2@training.com | trainee123 |
| Trainee | trainee3@training.com | trainee123 |

## 📁 Project Structure

```
training-attendance-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── logging.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── attendance.js
│   │   ├── training.js
│   │   ├── reports.js
│   │   └── notifications.js
│   ├── database/
│   │   └── schema.sql
│   ├── scripts/
│   │   ├── migrate.js
│   │   └── seed.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tailwind.config.js
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_attendance
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (Admin)
- `POST /api/users` - Create user (Admin)

### Attendance
- `GET /api/attendance/today` - Get today's attendance status
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/history` - Get attendance history

### Training
- `GET /api/training/programs` - Get training programs
- `POST /api/training/programs` - Create program (Admin/Supervisor)
- `GET /api/training/sessions` - Get training sessions

### Reports
- `GET /api/reports/attendance` - Generate attendance report
- `GET /api/reports/export/csv` - Export to CSV
- `GET /api/reports/export/pdf` - Export to PDF

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Monitoring & Logging

- **Winston**: Structured logging to files
- **Audit Trail**: Complete audit log in database
- **Error Handling**: Global error handling with proper responses
- **Rate Limiting**: API rate limiting for security

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Role-based Access Control**: Granular permissions
- **Input Validation**: Joi validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Proper CORS configuration
- **Rate Limiting**: Prevent API abuse

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Cloudinary account
4. Configure email service
5. Set up reverse proxy (nginx)
6. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts

## 🎉 Success Metrics

- ✅ Check-in completion in < 3 taps
- ✅ < 2 second page load time
- ✅ Zero confusion in user testing for role-specific workflows
- ✅ Mobile-responsive design
- ✅ Real-time updates
- ✅ Comprehensive reporting

---

**Built with ❤️ for efficient training attendance management**
