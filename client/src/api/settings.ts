import axios from './axios';
import type { TenantSettings, UpdateSettingsPayload, UploadSignature } from '@/types';

export const settingsApi = {
  get: () => axios.get<TenantSettings>('/app/settings'),
  update: (payload: UpdateSettingsPayload) =>
    axios.patch<TenantSettings>('/app/settings', payload),
  signUpload: (payload: { folder: string; publicId?: string }) =>
    axios.post<UploadSignature>('/app/uploads/sign', payload),
};