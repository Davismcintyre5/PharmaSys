import axios from './axios';
import type { AiInsight, AiChatResponse, AiQuota } from '@/types';

export const aiApi = {
  chat: (message: string) => axios.post<AiChatResponse>('/app/ai/chat', { message }),
  insights: (refresh = false) =>
    axios.get<AiInsight>('/app/ai/insights', { params: refresh ? { refresh: 'true' } : {} }),
  forecast: (refresh = false) =>
    axios.get<AiInsight>('/app/ai/forecast', { params: refresh ? { refresh: 'true' } : {} }),
  expiryRisk: (refresh = false) =>
    axios.get<AiInsight>('/app/ai/expiry-risk', { params: refresh ? { refresh: 'true' } : {} }),
  quota: () => axios.get<AiQuota>('/app/ai/quota'),
};