import axios from './axios';
import type { AppNotification, UnreadCountResponse, Paginated } from '@/types';

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    axios.get<AppNotification[]>('/app/notifications', { params }),
  unread: () => axios.get<UnreadCountResponse>('/app/notifications/unread'),
  markRead: (id: string) =>
    axios.post<{ read: boolean }>(`/app/notifications/${id}/read`),
  markAllRead: () =>
    axios.post<{ modified: number }>('/app/notifications/read-all'),
  remove: (id: string) => axios.delete<void>(`/app/notifications/${id}`),
  clear: () => axios.delete<{ deleted: number }>('/app/notifications/clear'),
};