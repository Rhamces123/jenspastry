// ==========================================
// BAKEOLOGY - useAuth Hook
// Custom hook to access authentication context
// ==========================================

import { useContext, createContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
