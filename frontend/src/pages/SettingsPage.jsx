import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Profile from '../components/settings/Profile';
import PharmacyInfo from '../components/settings/PharmacyInfo';
import UserManagement from '../components/settings/UserManagement';
import './Page.css';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Debug: log user to confirm role
  console.log('Current user:', user);

  return (
    <div className="page-container">
      <h1>Settings</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          className={activeTab === 'profile' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'pharmacy' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('pharmacy')}
        >
          Pharmacy Info
        </button>
        {user?.role === 'admin' && (
          <button
            className={activeTab === 'users' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        )}
      </div>

      <div className="card">
        {activeTab === 'profile' && <Profile user={user} />}
        {activeTab === 'pharmacy' && <PharmacyInfo />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
};

export default SettingsPage;