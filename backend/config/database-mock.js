const mockUsers = [
  {
    id: 'admin-id',
    email: 'admin@training.com',
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
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
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
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
    password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    full_name: 'Alice Trainee',
    role: 'trainee',
    department_id: 'dept-it',
    phone: '123-456-7892',
    is_active: true,
    created_at: new Date()
  }
];

const mockGenders = [
  { code: 'male', label: 'Male', sort_order: 1 },
  { code: 'female', label: 'Female', sort_order: 2 },
  { code: 'other', label: 'Other', sort_order: 3 },
  { code: 'prefer_not_to_say', label: 'Prefer not to say', sort_order: 4 }
];

const mockNationalities = [
  { code: 'filipino', label: 'Filipino', requires_other: false, sort_order: 1 },
  { code: 'filipino_american', label: 'Filipino-American', requires_other: false, sort_order: 2 },
  { code: 'dual_citizen', label: 'Dual Citizen', requires_other: false, sort_order: 3 },
  { code: 'other', label: 'Other', requires_other: true, sort_order: 4 }
];

const mockRanks = [
  { rank_code: '2LT', rank_name: 'Second Lieutenant', rank_category: 'commissioned_officer', grade: 'O-1', display_order: 1 },
  { rank_code: '1LT', rank_name: 'First Lieutenant', rank_category: 'commissioned_officer', grade: 'O-2', display_order: 2 },
  { rank_code: 'CPT', rank_name: 'Captain', rank_category: 'commissioned_officer', grade: 'O-3', display_order: 3 },
  { rank_code: 'MAJ', rank_name: 'Major', rank_category: 'commissioned_officer', grade: 'O-4', display_order: 4 },
  { rank_code: 'LTC', rank_name: 'Lieutenant Colonel', rank_category: 'commissioned_officer', grade: 'O-5', display_order: 5 },
  { rank_code: 'COL', rank_name: 'Colonel', rank_category: 'commissioned_officer', grade: 'O-6', display_order: 6 },
  { rank_code: 'BG', rank_name: 'Brigadier General', rank_category: 'commissioned_officer', grade: 'O-7', display_order: 7 },
  { rank_code: 'MG', rank_name: 'Major General', rank_category: 'commissioned_officer', grade: 'O-8', display_order: 8 },
  { rank_code: 'LTG', rank_name: 'Lieutenant General', rank_category: 'commissioned_officer', grade: 'O-9', display_order: 9 },
  { rank_code: 'GEN', rank_name: 'General', rank_category: 'commissioned_officer', grade: 'O-10', display_order: 10 },
  { rank_code: 'Pvt', rank_name: 'Private', rank_category: 'enlisted_personnel', grade: 'E-1', display_order: 11 },
  { rank_code: 'PFC', rank_name: 'Private First Class', rank_category: 'enlisted_personnel', grade: 'E-2', display_order: 12 },
  { rank_code: 'CPL', rank_name: 'Corporal', rank_category: 'enlisted_personnel', grade: 'E-3', display_order: 13 },
  { rank_code: 'Sgt', rank_name: 'Sergeant', rank_category: 'enlisted_personnel', grade: 'E-4', display_order: 14 },
  { rank_code: 'SSg', rank_name: 'Staff Sergeant', rank_category: 'enlisted_personnel', grade: 'E-5', display_order: 15 },
  { rank_code: 'TSg', rank_name: 'Technical Sergeant', rank_category: 'enlisted_personnel', grade: 'E-6', display_order: 16 },
  { rank_code: 'MSg', rank_name: 'Master Sergeant', rank_category: 'enlisted_personnel', grade: 'E-7', display_order: 17 },
  { rank_code: 'SMS', rank_name: 'Senior Master Sergeant', rank_category: 'enlisted_personnel', grade: 'E-8', display_order: 18 },
  { rank_code: 'CSM', rank_name: 'Chief Master Sergeant', rank_category: 'enlisted_personnel', grade: 'E-9', display_order: 19 }
];

const mockProfiles = [];

class MockPool {
  async query(text, params) {
    const query = text.toLowerCase();
    console.log('Mock Query:', text, params);

    if (query.includes('select')) {
      if (query.includes('ref_philippine_army_ranks')) {
        return { 
          rows: mockRanks.map(r => ({
            ...r,
            display_label: `${r.rank_code} - ${r.rank_name} (${r.grade})`
          }))
        };
      }
      if (query.includes('users') && query.includes('email')) {
        const user = mockUsers.find(u => u.email === params[0]);
        return { rows: user ? [user] : [] };
      }
      if (query.includes('users') && query.includes('id')) {
        const user = mockUsers.find(u => u.id === params[0]);
        return { rows: user ? [user] : [] };
      }
      if (query.includes('profiles') && query.includes('user_id')) {
        const profile = mockProfiles.find(p => p.user_id === params[0]);
        return { rows: profile ? [profile] : [] };
      }
      if (query.includes('now()')) {
        return { rows: [{ now: new Date() }] };
      }
    }

    if (query.includes('insert') || query.includes('update')) {
      if (query.includes('profiles')) {
        const userId = params[0];
        const existingIndex = mockProfiles.findIndex(p => p.user_id === userId);
        const profileData = { user_id: userId, ...params }; // Simplified
        if (existingIndex >= 0) {
          mockProfiles[existingIndex] = { ...mockProfiles[existingIndex], ...profileData };
        } else {
          mockProfiles.push(profileData);
        }
        return { rows: [profileData], rowCount: 1 };
      }
      if (query.includes('users')) {
        return { rows: [{ id: params[0] || 'new-user-id' }], rowCount: 1 };
      }
    }

    return { rows: [], rowCount: 0 };
  }

  async connect() {
      console.log('Mock database connected');
      return {
          query: this.query.bind(this),
          release: () => {}
      };
  }

  async end() {
    console.log('Mock database connection closed');
  }
}

module.exports = new MockPool();
