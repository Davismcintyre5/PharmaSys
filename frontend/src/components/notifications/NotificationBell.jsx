import React from 'react';
import { FaBell } from 'react-icons/fa';

const NotificationBell = ({ count, onClick }) => {
  return (
    <div className="notification-bell" onClick={onClick}>
      <FaBell />
      {count > 0 && <span className="badge">{count}</span>}
    </div>
  );
};

export default NotificationBell;