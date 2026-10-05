import axios from './axios';
import type {
  AiInfo,
  Brand,
  ChatInfo,
  ChatReply,
  LegalDoc,
  LegalSummary,
  PublicDownload,
  PublicInvoice,
  PublicPlan,
  PublicSettings,
} from '@/types';

export const publicApi = {
  site: {
    getBrand: () => axios.get<Brand>('/public/site/brand'),
    getSettings: () => axios.get<PublicSettings>('/public/site/settings'),
    getPlans: () => axios.get<PublicPlan[]>('/public/site/plans'),
    getAi: () => axios.get<AiInfo>('/public/site/ai'),
    getLegal: () => axios.get<LegalSummary[]>('/public/site/legal'),
    getLegalByType: (type: string) => axios.get<LegalDoc>(`/public/site/legal/${type}`),
    getDownloads: () => axios.get<PublicDownload[]>('/public/site/downloads'),
  },

  plans: {
    list: () => axios.get<PublicPlan[]>('/public/plans'),
  },

  invoices: {
    getByNumber: (number: string) =>
      axios.get<PublicInvoice>(`/public/invoices/${number}`),
  },

  chat: {
    getInfo: () => axios.get<ChatInfo>('/public/chat/info'),
    send: (message: string) =>
      axios.post<ChatReply>('/public/chat/chat', { message }),
  },
};