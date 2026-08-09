import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User, type UserProfileResponse } from '@/lib/api';
import { applyGoogleFont } from '@/lib/fonts';
import { applyTextColor } from '@/lib/colors';

interface AuthContextType {
  user: User | null;
  stats: UserProfileResponse['stats'] | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  signup: (username: string, email: string, password: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserProfileResponse['stats'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setStats(res.stats);
      if (res.user.fontFamily) applyGoogleFont(res.user.fontFamily);
      if (res.user.colorTheme) applyTextColor(res.user.colorTheme, true);
    } catch {
      setUser(null);
      setStats(null);
      applyGoogleFont('Inter');
      applyTextColor({ name: 'Amber Glow', value: '#fbbf24', isGradient: false }, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await fetchProfile();
  };

  const googleLogin = async (credential: string) => {
    await api.googleLogin(credential);
    await fetchProfile();
  };

  const signup = async (username: string, email: string, password: string, avatarUrl?: string) => {
    await api.signup(username, email, password, avatarUrl);
    await fetchProfile();
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setStats(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('velocitype_local_avatar');
    }
    // Reset to defaults
    applyGoogleFont('Inter');
    applyTextColor({ name: 'Amber Glow', value: '#fbbf24', isGradient: false }, true);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, stats, loading, login, googleLogin, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
