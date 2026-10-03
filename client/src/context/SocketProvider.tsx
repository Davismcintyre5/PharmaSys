import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import type { AppNotification } from '@/types/app';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;

  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: AppNotification) => void;
  setNotifications: (n: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, scope } = useAuth();

  const [connected, setConnected] = useState(false);
  const [notifications, setNotificationsState] = useState<AppNotification[]>([]);

  const socketRef = useRef<Socket | null>(null);

  /* ─── connect / reconnect when auth changes ─── */
  useEffect(() => {
    if (!accessToken || scope !== 'active') {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setNotificationsState([]);
      return;
    }

    const socket = io(SOCKET_URL, {
      path: '/api/live/ws',
      transports: ['websocket'],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('notification:new', (payload: AppNotification) => {
      setNotificationsState((prev) => {
        if (prev.some((n) => n._id === payload._id)) return prev;
        return [payload, ...prev].slice(0, 100);
      });
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [accessToken, scope]);

  /* ─── notification actions ─── */
  const addNotification = useCallback((n: AppNotification) => {
    setNotificationsState((prev) => {
      if (prev.some((x) => x._id === n._id)) return prev;
      return [n, ...prev].slice(0, 100);
    });
  }, []);

  const setNotifications = useCallback((items: AppNotification[]) => {
    setNotificationsState(items.slice(0, 100));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotificationsState((prev) =>
      prev.map((n) =>
        n._id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotificationsState((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotificationsState((prev) => prev.filter((n) => n._id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationsState([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications]
  );

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: socketRef.current,
      connected,
      notifications,
      unreadCount,
      addNotification,
      setNotifications,
      markRead,
      markAllRead,
      removeNotification,
      clearNotifications,
    }),
    [
      connected,
      notifications,
      unreadCount,
      addNotification,
      setNotifications,
      markRead,
      markAllRead,
      removeNotification,
      clearNotifications,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}