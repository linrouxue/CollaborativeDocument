import axiosInstance from './axios';
import { setAccessToken, getAccessToken } from './tokenManager';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  captcha: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  data?: {
    user: {
      id: number;
      email: string;
      username?: string;
    };
    accessToken?: string;
  };
}

// 登录
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post('/user/login', credentials);
    if (data && data.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || '登录失败');
  }
};

// 注册
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    const { data } = await axiosInstance.post('/user/register', userData);
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || '注册失败');
  }
};

// 刷新 token
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { data } = await axiosInstance.post('/auth/refresh');
    if (data && data.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
};

// 登出
export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('/user/logout');
  } catch (error) {
    // 忽略后端登出失败
  } finally {
    setAccessToken(null);
  }
};

// 检查用户是否已登录
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error('未登录');
    const { data } = await axiosInstance.post(
      '/user/get-profile',
      {},
      { headers: { Authorization: `Bearer ${token}` } } // 配置项
    );
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || '获取用户信息失败');
  }
};
