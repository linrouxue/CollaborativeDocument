# 协作文档系统

## 环境配置

1. 克隆仓库后，首先需要配置数据库连接：

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入您的数据库连接信息
# DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"
```

2. 安装依赖：

```bash
pnpm install
```

3. 初始化数据库：

```bash
# 拉取数据库结构
pnpm db:pull

# 生成 Prisma Client
pnpm db:generate
```

4. 启动开发服务器：

```bash
pnpm start:dev
```

## 数据库配置说明

项目使用 MySQL 数据库，您需要：

1. 准备一个 MySQL 数据库
2. 在 `.env` 文件中配置数据库连接信息：
   ```
   DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"
   ```

## 开发注意事项

- 不要直接修改生产数据库
- 使用数据库管理工具进行数据库操作
- 所有数据库更改都应该通过数据库管理工具进行
- 在执行任何数据库操作前，确保已经备份数据

## 项目结构

- `src/app/api/` - API 路由
- `src/server/` - WebSocket 服务器
- `prisma/` - 数据库配置和迁移文件
- `src/components/` - React 组件
- `src/lib/` - 工具函数和配置

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
