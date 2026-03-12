import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600">Welcome to the Training Attendance Management System</p>
          <div className="mt-6 space-y-2">
            <div className="bg-green-100 text-green-800 p-4 rounded">✅ Backend Server: Running on port 5001</div>
            <div className="bg-blue-100 text-blue-800 p-4 rounded">🔄 Frontend: Starting...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
