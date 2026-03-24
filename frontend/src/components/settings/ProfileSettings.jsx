import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword } from '../../services/settingsService';

const ProfileSettings = () => {
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ username: profile.username, email: profile.email });
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword,
      });
      setMessage('Password changed successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {message && <p className="text-green-600 text-sm mb-4">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;