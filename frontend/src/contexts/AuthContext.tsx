import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User, type UserProfileResponse } from '@/lib/api';
import { applyGoogleFont } from '@/lib/fonts';


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

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setStats(res.stats);
      if (res.user.fontFamily) applyGoogleFont(res.user.fontFamily);
      if (res.user.portalBorder && typeof window !== 'undefined') {
        localStorage.setItem('velocitype_portal_border', res.user.portalBorder);
        window.dispatchEvent(new Event('storage'));
      }
    } catch {
      setUser(null);
      setStats(null);
      // We no longer reset colors here, because if they are a guest (e.g. invalid session),
      // we want to preserve whatever is saved in their localStorage that main.tsx already loaded.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await fetchProfile(true);
  };

  const googleLogin = async (credential: string) => {
    await api.googleLogin(credential);
    await fetchProfile(true);
  };

  const signup = async (username: string, email: string, password: string, avatarUrl?: string) => {
    await api.signup(username, email, password, avatarUrl);
    await fetchProfile(true);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setStats(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('velocitype_local_avatar');
      localStorage.removeItem('velocitype_portal_border');
      window.dispatchEvent(new Event('storage'));
    }
    // Reset to defaults on explicit logout
    applyGoogleFont('Inter');
    if (typeof window !== 'undefined') {
      localStorage.setItem('velocitype_portal_border', 'b16');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const refreshUser = async () => {
    await fetchProfile(true);
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
