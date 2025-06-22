// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/style/globals.css';
import { ConfigProvider } from 'antd';
import theme from './themeConfig';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from '@/components/providers/Providers';

export const metadata: Metadata = {
  title: '协同文档',
  description: '基于 Next.js 和 Ant Design 的协同文档系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <Providers>{children}</Providers>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
