import axios, { AxiosError, AxiosResponse } from 'axios';
import { getAccessToken, setAccessToken } from './tokenManager';

// 本地API
export const baseURL = 'http://localhost:3000/api';
// Java后端API
export const JavaBaseURL = 'http://119.29.229.71:8585';

// 通用请求拦截器
function requestInterceptor(config: any) {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// 通用响应拦截器（本地接口用，直接返回 response）
function responseInterceptor(response: AxiosResponse) {
  const data = response.data;
  if (data && data.success === false) {
    return Promise.reject(new Error(data.message || '接口请求失败'));
  }
  return response;
}

// 全局唯一的刷新标志
const refreshFlag = { isRefreshing: false, refreshPromise: null as any };

// 通用错误拦截器，所有实例都用 axiosInstance 刷新 token
async function errorInterceptor(error: AxiosError, instance: any) {
  const originalRequest = error.config as any;
  if (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest.url.includes('/auth/refresh')
  ) {
    originalRequest._retry = true;
    if (!refreshFlag.isRefreshing) {
      refreshFlag.isRefreshing = true;
      refreshFlag.refreshPromise = axiosInstance
        .post('/auth/refresh')
        .then((res: any) => {
          const newToken = res.data?.accessToken;
          setAccessToken(newToken);
          refreshFlag.isRefreshing = false;
          return newToken;
        })
        .catch(() => {
          setAccessToken(null);
          refreshFlag.isRefreshing = false;
          window.location.href = '/login';
          return null;
        });
    }
    const newToken = await refreshFlag.refreshPromise;
    if (newToken) {
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return instance(originalRequest);
    }
  }
  // 统一错误处理
  if (error.response) {
    switch (error.response.status) {
      case 401:
        break;
      case 403:
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

// 本地 axios 实例
const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(requestInterceptor, Promise.reject);
axiosInstance.interceptors.response.use(responseInterceptor, (error) =>
  errorInterceptor(error, axiosInstance)
);

// Java axios 实例
const javaAxiosInstance = axios.create({
  baseURL: JavaBaseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

javaAxiosInstance.interceptors.request.use(requestInterceptor, Promise.reject);
javaAxiosInstance.interceptors.response.use(responseInterceptor, (error) =>
  errorInterceptor(error, javaAxiosInstance)
);

export default axiosInstance;
export { javaAxiosInstance };
