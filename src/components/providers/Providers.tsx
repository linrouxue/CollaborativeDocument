'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { App } from 'antd';
import { AlertProvider } from '@/contexts/AlertContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { refreshAccessTokenWithRetry } from '@/lib/api/axios';
import { useRouter } from 'next/navigation';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  // 这里的目的是为了解决刷新的时候java解决过早发送导致获取不到token的问题
  useEffect(() => {
    let isMounted = true; // 组件挂载标志
    let redirectTimeout: NodeJS.Timeout;

    const checkToken = async () => {
      try {
        const token = await refreshAccessTokenWithRetry(3, 1000);
        if (!token && isMounted) {
          redirectTimeout = setTimeout(() => {
            router.replace('/login');
          }, 100); // 微小延迟避免竞争
        }
      } finally {
        if (isMounted) setReady(true);
      }
    };

    checkToken();

    return () => {
      isMounted = false;
      clearTimeout(redirectTimeout); // 清理未执行的重定向
    };
  }, [router]);
  if (!ready) return null; // 或可替换为 loading 组件

  return (
    <AlertProvider>
      <App>
        <AuthProvider>{children}</AuthProvider>
      </App>
    </AlertProvider>
  );
};
