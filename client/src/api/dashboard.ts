import axios from './axios';
import type { DashboardSummary, AiInsight } from '@/types';

export const dashboardApi = {
  getSummary: () => axios.get<DashboardSummary>('/app/dashboard/summary'),
  getInsights: () => axios.get<AiInsight>('/app/dashboard/insights'),
};