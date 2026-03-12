import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/user.service'; // assume this service exists
import Modal from '../common/Modal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'cashier' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData({ name: '', email: '', password: '', role: 'cashier' });
    setModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditing(user);
    setFormData({ ...user, password: '' }); // don't prefill password
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
      loadUsers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateUser(editing._id, formData);
    } else {
      await createUser(formData);
    }
    setModalOpen(false);
    loadUsers();
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="settings-section">
      <h2>User Management</h2>
      <button onClick={handleAdd} className="success">Add User</button>
      <table className="data-table" style={{ marginTop: '20px' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan="4">No users found</td></tr>
          ) : (
            users.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={() => handleEdit(u)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(u._id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Password {editing && '(leave blank to keep unchanged)'}</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editing} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange}>
              <option value="admin">Admin</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button type="submit" className="success">Save</button>
          <button type="button" className="secondary" onClick={() => setModalOpen(false)}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;