// 全局认证上下文
// 在任何组件里都能方便地获取和操作当前用户的认证信息
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  refreshAccessToken,
} from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api/tokenManager';
import { useAlert } from '@/contexts/AlertContext';

interface User {
  id: number;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // 刷新 token 并获取用户信息
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      // 自动刷新 accessToken
      const newToken = await refreshAccessToken();
      if (newToken) {
        // 拿到新 token 后获取用户信息
        const res = await getCurrentUser();
        if (res && res.success && res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
          if (hasTriedRefresh) showAlert('登录已失效，请重新登录', 'warning');
          router.push('/login');
        }
      } else {
        setUser(null);
        if (hasTriedRefresh) showAlert('登录已失效，请重新登录', 'warning');
        router.push('/login');
      }
    } catch (error) {
      setUser(null);
      if (hasTriedRefresh) showAlert('登录已失效，请重新登录', 'warning');
      router.push('/login');
    } finally {
      setHasTriedRefresh(true);
      setLoading(false);
    }
  }, [router, hasTriedRefresh, showAlert]);

  // 登录
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      if (res && res.data && res.data.accessToken) {
        // 登录成功后用 accessToken 获取用户信息
        const userRes = await getCurrentUser();
        if (userRes && userRes.data && userRes.data.user) {
          setUser(userRes.data.user);
          showAlert('登录成功', 'success');
          router.push('/Home');
        } else {
          setUser(null);
          showAlert('获取用户信息失败', 'error');
        }
      } else {
        setUser(null);
        showAlert(res?.message || '登录失败', 'error');
      }
    } catch (error: any) {
      setUser(null);
      showAlert(error?.message || '登录失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi();
      setUser(null);
      setAccessToken(null);
      showAlert('已退出登录', 'info');
      router.push('/login');
    } catch (error) {
      showAlert('登出失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 初始化时自动刷新 token 并获取用户信息
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
