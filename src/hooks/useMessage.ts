'use client';
import { App } from 'antd';

export const useMessage = () => {
  return App.useApp().message;
};
