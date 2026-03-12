import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/setting.service';

const PharmacyInfo = () => {
  const [settings, setSettings] = useState({
    pharmacyName: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    currency: 'KES',
    taxRate: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      setSettings(res.data.data);
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    }
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-section">
      <h2>Pharmacy Information</h2>
      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}
      <div className="settings-card">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pharmacy Name</label>
              <input
                type="text"
                name="pharmacyName"
                value={settings.pharmacyName || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={settings.address || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={settings.email || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={settings.licenseNumber || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={settings.currency} onChange={handleChange}>
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <button type="submit" className="success">Save Changes</button>
            <button type="button" className="secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Pharmacy Name:</strong> {settings.pharmacyName || 'Not set'}</p>
            <p><strong>Address:</strong> {settings.address || 'Not set'}</p>
            <p><strong>Phone:</strong> {settings.phone || 'Not set'}</p>
            <p><strong>Email:</strong> {settings.email || 'Not set'}</p>
            <p><strong>License Number:</strong> {settings.licenseNumber || 'Not set'}</p>
            <p><strong>Currency:</strong> {settings.currency}</p>
            <p><strong>Tax Rate:</strong> {settings.taxRate}%</p>
            <button onClick={() => setIsEditing(true)}>Edit Info</button>
          </>
        )}
      </div>
    </div>
  );
};

export default PharmacyInfo;