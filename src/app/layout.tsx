// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConfigProvider } from 'antd';
import theme from './themeConfig';
import { AntdRegistry } from '@ant-design/nextjs-registry';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '协同文档系统',
  description: '基于 Next.js 和 Ant Design 的协同文档系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
