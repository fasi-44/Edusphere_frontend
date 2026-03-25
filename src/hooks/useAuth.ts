/**
 * useAuth Hook
 * Custom hook to access and manipulate auth state
 */

import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  return useAuthStore();
};
