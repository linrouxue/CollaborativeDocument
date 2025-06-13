// src/app/themeConfig.ts
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
    },
    Layout: {
      headerBg: '#fff',
      bodyBg: '#f5f7fa',
    },
  },
};

export default theme;