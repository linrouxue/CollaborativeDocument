import axios, { AxiosError, AxiosResponse } from 'axios';
import { getAccessToken, setAccessToken } from './tokenManager';

export const baseURL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 自动带上 httpOnly cookie
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response; // 返回完整 response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // 如果是 401 错误且不是刷新 token 的请求
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      console.log('🚨 401 error detected, attempting token refresh...');
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axiosInstance
          .post('/auth/refresh')
          .then((res) => {
            const newToken = res.data?.accessToken;
            setAccessToken(newToken);
            isRefreshing = false;
            return newToken;
          })
          .catch(() => {
            setAccessToken(null);
            isRefreshing = false;
            window.location.href = '/login';
            return null;
          });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        console.log('✅ Token refreshed, retrying original request');
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
    }

    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，已在上面处理
          break;
        case 403:
          // 处理禁止访问
          break;
        case 404:
          break;
        case 500:
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接');
    } else {
      console.error('请求配置错误:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
