import { useState, useEffect } from 'react';
import { getSettings } from '../services/setting.service';
import { setCurrency } from '../utils/currency';

export const useSettings = () => {
  const [settings, setSettings] = useState({ currency: 'KES', taxRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        const data = res.data.data;
        setSettings(data);
        setCurrency(data.currency);
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { settings, loading };
};