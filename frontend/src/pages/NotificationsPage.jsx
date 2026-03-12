import React, { useState, useEffect } from 'react';
import { getNotifications, markAsRead } from '../services/notification.service';
import './Page.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    loadNotifications();
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="page-container">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((notif) => (
            <li key={notif._id} className={notif.read ? 'read' : 'unread'}>
              <span>{notif.message}</span>
              {!notif.read && (
                <button onClick={() => handleMarkRead(notif._id)}>Mark as read</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;