'use client';

import React, { ReactNode } from 'react';
import { App } from 'antd';
import { AlertProvider } from '@/contexts/AlertContext';
import { AuthProvider } from '@/contexts/AuthContext';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AlertProvider>
      <AuthProvider>
        <App>{children}</App>
      </AuthProvider>
    </AlertProvider>
  );
};
