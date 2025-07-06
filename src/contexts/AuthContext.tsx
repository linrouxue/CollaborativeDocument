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
import { getCurrentUser, login as loginApi, logout as logoutApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api/tokenManager';
import { useMessage } from '@/hooks/useMessage';

interface User {
  id: number;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, callback?: string) => Promise<void>;
  logout: () => Promise<void>;
  // refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const message = useMessage();

  // 登录
  const login = async (email: string, password: string, callback?: string) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      if (res && res.data && res.data.accessToken) {
        // 登录成功后用 accessToken 获取用户信息
        const userRes = await getCurrentUser();
        if (userRes && userRes.data && userRes.data.user) {
          setUser(userRes.data.user);
          message.success('登录成功');
          // 根据callback跳转
          if (callback) {
            router.push(callback);
          } else {
            router.push('/Home');
          }
        } else {
          setUser(null);
          message.error('获取用户信息失败');
        }
      } else {
        setUser(null);
        message.error(res?.message || '登录失败');
      }
    } catch (error: any) {
      setUser(null);
      message.error(error?.message || '登录失败，请重试');
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
      message.info('已退出登录');
      router.push('/login');
    } catch (error) {
      message.error('登出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // // 初始化时自动刷新 token 并获取用户信息
  // useEffect(() => {
  //   refreshUser();
  //   // eslint-disable-next-line
  // }, []);

  useEffect(() => {
    setLoading(true);
    getCurrentUser()
      .then((res) => {
        if (res && res.success && res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    // refreshUser,
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
