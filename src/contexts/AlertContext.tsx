'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Alert } from 'antd';

type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AlertState {
  id: number; // 唯一标识符
  message: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});
  const nextId = useRef(0);

  // 清理所有定时器
  useEffect(() => {
    const currentTimeouts = timeoutRefs.current;
    return () => {
      Object.values(currentTimeouts).forEach(clearTimeout);
    };
  }, []);

  const showAlert = (message: string, type: AlertType = 'info', duration = 2000) => {
    const id = nextId.current++;
    const newAlert = { id, message, type };

    // 添加新提示
    setAlerts((prev) => [...prev, newAlert]);

    // 设置显示状态
    setTimeout(() => {
      setVisibleIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    }, 10);

    // 设置隐藏定时器
    timeoutRefs.current[id] = setTimeout(() => {
      setVisibleIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // 延迟移除提示
      timeoutRefs.current[id] = setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        delete timeoutRefs.current[id];
      }, 300);
    }, duration);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {/* 渲染所有提示 */}
      <div className="alert-container">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`custom-alert ${visibleIds.has(alert.id) ? 'show' : ''}`}
            style={{
              position: 'fixed',
              top: 80 + alerts.findIndex((a) => a.id === alert.id) * 60, // 堆叠效果
              left: '50%',
              zIndex: 9999,
              minWidth: 320,
              pointerEvents: 'none',
              transform: 'translateX(-50%)',
            }}
          >
            <Alert
              message={alert.message}
              type={alert.type}
              showIcon
              closable={false}
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        ))}
      </div>

      {children}

      {/* 全局样式 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-alert {
            opacity: 0;
            transform: translate(-50%, -20px) !important;
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          .custom-alert.show {
            opacity: 1;
            transform: translate(-50%, 0) !important;
          }
        `,
        }}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};
