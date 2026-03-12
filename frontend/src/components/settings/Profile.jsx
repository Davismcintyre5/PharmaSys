import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../services/user.service'; // we'll create this

const Profile = ({ user }) => {
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    // TODO: API call to update profile (if you have endpoint)
    console.log('Update profile', formData);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Profile updated (demo)' });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <div className="settings-section">
      <h2>Profile</h2>
      {message.text && (
        <div className={`alert ${message.type}`}>{message.text}</div>
      )}
      <div className="settings-card">
        {isEditing ? (
          <form onSubmit={handleSubmitProfile}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="success">Save Changes</button>
            <button type="button" className="secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </form>
        ) : changingPassword ? (
          <form onSubmit={handleSubmitPassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button type="submit" className="success">Change Password</button>
            <button type="button" className="secondary" onClick={() => setChangingPassword(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="secondary" onClick={() => setChangingPassword(true)}>Change Password</button>
              <button className="danger" onClick={handleLogout}>Logout</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;