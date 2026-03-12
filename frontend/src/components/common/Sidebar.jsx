import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>PharmaSys Admin</h2>
      <ul>
        <li><NavLink to="/" end>Dashboard</NavLink></li>
        <li><NavLink to="/medicines">Medicines</NavLink></li>
        <li><NavLink to="/patients">Patients</NavLink></li>
        <li><NavLink to="/prescriptions">Prescriptions</NavLink></li>
        <li><NavLink to="/suppliers">Suppliers</NavLink></li>
        <li><NavLink to="/reports">Reports</NavLink></li>
        <li><NavLink to="/accounts">Accounts</NavLink></li>
        <li><NavLink to="/settings">Settings</NavLink></li>
        <li><NavLink to="/notifications">Notifications</NavLink></li>
      </ul>
    </div>
  );
};

export default Sidebar;