// src/app/page.tsx
import BasicLayout from './knowledges/page'

export default function Home() {
  return (
    <BasicLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold">欢迎使用协同文档系统</h1>
        <p className="mt-4">这是一个基于 Next.js 和 Ant Design 的协同文档系统</p>
      </div>
    </BasicLayout>
  );
}