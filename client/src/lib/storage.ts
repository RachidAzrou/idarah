// Local storage utilities with error handling

export const storage = {
  get: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage get failed:', error);
      return null;
    }
  },

  set: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage set failed:', error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage remove failed:', error);
      return false;
    }
  },

  // PWA specific keys
  PWA_INSTALL_COACH_DISMISSED: 'LB_PWA_INSTALL_COACH_V1'
};