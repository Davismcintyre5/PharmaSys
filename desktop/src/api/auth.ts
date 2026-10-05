import axios from './axios';
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AcceptInvitePayload,
  MeResponse,
} from '@/types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    axios.post<AuthSession>('/auth/register', payload, { skipAuth: true }),

  login: (payload: LoginPayload) =>
    axios.post<AuthSession>('/auth/login', payload, { skipAuth: true }),

  refresh: (refreshToken: string) =>
    axios.post<AuthSession>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true, skipRefresh: true }
    ),

  logout: () => axios.post<{ loggedOut: boolean }>('/auth/logout'),

  me: (_token?: string) => axios.get<MeResponse>('/auth/me'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    axios.post<{ sent: boolean }>('/auth/forgot-password', payload, { skipAuth: true }),

  resetPassword: (payload: ResetPasswordPayload) =>
    axios.post<{ reset: boolean }>('/auth/reset-password', payload, { skipAuth: true }),

  acceptInvite: (payload: AcceptInvitePayload) =>
    axios.post<AuthSession>('/auth/accept-invite', payload, { skipAuth: true }),

  impersonateExchange: (impToken: string) =>
    axios.post<AuthSession>(
      '/auth/impersonate-exchange',
      { impToken },
      { skipAuth: true }
    ),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    axios.post<{ changed: boolean }>('/auth/change-password', payload),
};