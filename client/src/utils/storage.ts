export const storage = {
  get<T>(key: string, fallback: T | null = null): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },

  getRaw(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setRaw(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  clear(prefix?: string): void {
    try {
      if (!prefix) {
        localStorage.clear();
        return;
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) localStorage.removeItem(k);
      }
    } catch {}
  },

  isAvailable(): boolean {
    try {
      const k = '__test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  },
};

export const session = {
  get<T>(key: string, fallback: T | null = null): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  },
};