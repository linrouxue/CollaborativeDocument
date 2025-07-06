import axios, { AxiosError, AxiosResponse } from 'axios';
import { getAccessToken, setAccessToken } from './tokenManager';

// 本地API
export const baseURL = 'http://localhost:3000/api';
// Java后端API
export const JavaBaseURL = 'http://119.29.229.71:8585';
// export const JavaBaseURL = 'http://localhost:8585';

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

// 刷新token带重试
export async function refreshAccessTokenWithRetry(retryCount = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < retryCount; i++) {
    try {
      const res = await axiosInstance.post('/auth/refresh');
      const newToken = res.data?.accessToken;
      setAccessToken(newToken);
      return newToken;
    } catch (err: any) {
      lastError = err;
      // 只对网络错误/超时重试，401/403 直接 break
      if (err.response && [401, 403].includes(err.response.status)) {
        break;
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  setAccessToken(null);
  return Promise.reject(lastError);
}

// 全局唯一的刷新标志
const refreshFlag = {
  isRefreshing: false,
  refreshPromise: null as Promise<string> | null,
  pendingRequests: [] as Array<(token: string | null) => void>,
};

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
      refreshFlag.refreshPromise = (async () => {
        try {
          // 用重试机制
          const newToken = await refreshAccessTokenWithRetry(3, 1000);
          return newToken;
        } catch (refreshError) {
          setAccessToken(null);
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          refreshFlag.isRefreshing = false;
          refreshFlag.refreshPromise = null;
        }
      })();
    }

    // 将当前请求加入队列
    return new Promise((resolve, reject) => {
      refreshFlag.pendingRequests.push((newToken: string | null) => {
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(instance(originalRequest));
        } else {
          reject(new Error('令牌刷新失败'));
        }
      });

      // 如果刷新正在进行，等待刷新完成
      if (refreshFlag.refreshPromise) {
        refreshFlag.refreshPromise
          .then((newToken) => {
            // 处理所有等待的请求
            refreshFlag.pendingRequests.forEach((cb) => cb(newToken));
            refreshFlag.pendingRequests = [];
          })
          .catch(() => {
            refreshFlag.pendingRequests.forEach((cb) => cb(null));
            refreshFlag.pendingRequests = [];
          });
      }
    });
  }

  // 其他错误处理
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

axiosInstance.interceptors.request.use(requestInterceptor, (error) => {
  return Promise.reject(error);
});

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

javaAxiosInstance.interceptors.request.use(requestInterceptor, (error) => {
  return Promise.reject(error);
});

javaAxiosInstance.interceptors.response.use(responseInterceptor, (error) =>
  errorInterceptor(error, javaAxiosInstance)
);

export default axiosInstance;
export { javaAxiosInstance };
