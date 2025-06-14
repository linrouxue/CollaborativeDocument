// src/app/Home/layout.tsx
import type { Metadata } from 'next';
import '../globals.css';
import { ConfigProvider } from 'antd';
import theme from '../themeConfig';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: "协同文档系统",
  description: "基于 Next.js 和 Ant Design 的协同文档系统",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
