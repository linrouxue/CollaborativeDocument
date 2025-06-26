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
  useRef,
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
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清除定時器
  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  // 設置定時刷新 token（每 14 分鐘刷新一次，確保在 15 分鐘過期前刷新）
  const setupTokenRefresh = useCallback(() => {
    clearRefreshTimer();
    // 每 14 分鐘刷新一次 token
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('✅ Token 自動刷新成功');
          // 重新設置定時器
          setupTokenRefresh();
        } else {
          console.log('❌ Token 自動刷新失敗');
          // 如果刷新失敗，嘗試獲取用戶信息
          await refreshUser();
        }
      } catch (error) {
        console.error('Token 自動刷新錯誤:', error);
        await refreshUser();
      }
    }, 14 * 60 * 1000); // 14 分鐘
  }, []);

  // 刷新 token 並獲取用戶信息
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      // 自動刷新 accessToken
      const newToken = await refreshAccessToken();
      if (newToken) {
        // 拿到新 token 后獲取用戶信息
        const res = await getCurrentUser();
        if (res && res.success && res.data && res.data.user) {
          setUser(res.data.user);
          // 設置定時刷新
          setupTokenRefresh();
        } else {
          // 只有在已經嘗試過刷新且確實無法獲取用戶信息時才清空
          if (hasTriedRefresh) {
            setUser(null);
            showAlert('登錄已失效，請重新登錄', 'warning');
            router.push('/login');
          }
        }
      } else {
        // 只有在已經嘗試過刷新且確實無法獲取新 token 時才清空
        if (hasTriedRefresh) {
          setUser(null);
          showAlert('登錄已失效，請重新登錄', 'warning');
          router.push('/login');
        }
      }
    } catch (error) {
      // 只有在已經嘗試過刷新且確實發生錯誤時才清空
      if (hasTriedRefresh) {
        setUser(null);
        showAlert('登錄已失效，請重新登錄', 'warning');
        router.push('/login');
      }
    } finally {
      setHasTriedRefresh(true);
      setLoading(false);
    }
  }, [router, hasTriedRefresh, showAlert, setupTokenRefresh]);

  // 登錄
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      if (res && res.data && res.data.accessToken) {
        // 登錄成功后用 accessToken 獲取用戶信息
        const userRes = await getCurrentUser();
        if (userRes && userRes.data && userRes.data.user) {
          setUser(userRes.data.user);
          // 設置定時刷新
          setupTokenRefresh();
          showAlert('登錄成功', 'success');
          router.push('/Home');
        } else {
          setUser(null);
          showAlert('獲取用戶信息失敗', 'error');
        }
      } else {
        setUser(null);
        showAlert(res?.message || '登錄失敗', 'error');
      }
    } catch (error: any) {
      setUser(null);
      showAlert(error?.message || '登錄失敗，請重試', 'error');
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
      // 清除定時器
      clearRefreshTimer();
      showAlert('已退出登錄', 'info');
      router.push('/login');
    } catch (error) {
      showAlert('登出失敗，請重試', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 初始化時自動刷新 token 並獲取用戶信息
  useEffect(() => {
    refreshUser();
    
    // 組件卸載時清除定時器
    return () => {
      clearRefreshTimer();
    };
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
