// Simple in-memory database mock for demonstration
const mockUsers = [
  {
    id: 'admin-id',
    email: 'admin@training.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    full_name: 'System Administrator',
    role: 'admin',
    department_id: null,
    phone: '123-456-7890',
    is_active: true,
    created_at: new Date()
  },
  {
    id: 'supervisor-id',
    email: 'supervisor@training.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    full_name: 'John Supervisor',
    role: 'supervisor',
    department_id: 'dept-it',
    phone: '123-456-7891',
    is_active: true,
    created_at: new Date()
  },
  {
    id: 'trainee-id',
    email: 'trainee1@training.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    full_name: 'Alice Trainee',
    role: 'trainee',
    department_id: 'dept-it',
    phone: '123-456-7892',
    is_active: true,
    created_at: new Date()
  }
];

class MockPool {
  async query(text, params) {
    console.log('Mock Query:', text, params);

    // Simple mock responses
    if (text.includes('SELECT') && text.includes('users') && text.includes('email')) {
      const user = mockUsers.find(u => u.email === params[0]);
      return { rows: user ? [user] : [] };
    }

    if (text.includes('INSERT') && text.includes('users')) {
      return { rows: [{ id: 'new-user-id', ...params }] };
    }

    return { rows: [] };
  }

  async end() {
    console.log('Mock database connection closed');
  }
}

module.exports = new MockPool();
