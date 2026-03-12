import { useState, useEffect } from 'react';
import { getNotifications, markAsRead } from '../services/notification.service';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await getNotifications();
    setNotifications(res.data);
    setUnreadCount(res.data.filter(n => !n.read).length);
  };

  const markRead = async (id) => {
    await markAsRead(id);
    loadNotifications();
  };

  return { notifications, unreadCount, markRead };
};