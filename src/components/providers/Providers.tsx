'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { App } from 'antd';
import { AlertProvider } from '@/contexts/AlertContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { refreshAccessToken } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  // 这里的目的是为了解决刷新的时候java解决过早发送导致获取不到token的问题
  useEffect(() => {
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          router.replace('/login'); // 刷新失败自动跳转登录
        }
      })
      .finally(() => setReady(true));
  }, [router]);

  if (!ready) return null; // 或可替换为 loading 组件

  return (
    <AlertProvider>
      <AuthProvider>
        <App>{children}</App>
      </AuthProvider>
    </AlertProvider>
  );
};
