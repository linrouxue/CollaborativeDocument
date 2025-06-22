# 数据库操作指南

## ⚠️ 重要警告

以下命令已被完全禁用，因为它们可能会直接修改生产数据库：

- `prisma db push` - 已被禁用
- `prisma migrate deploy` - 已被禁用
- 任何直接使用 `prisma` CLI 的命令

## 安全操作命令

以下命令是安全的，可以随时使用：

```bash
# 从数据库拉取最新的结构
pnpm db:pull

# 生成 Prisma Client
pnpm db:generate

# 打开 Prisma Studio 查看数据
pnpm db:studio
```

## 数据库变更流程

1. 在开发环境中进行更改
2. 使用数据库管理工具（如 MySQL Workbench）来执行更改
3. 在测试环境验证更改
4. 使用数据库管理工具在生产环境执行更改

## 注意事项

- 永远不要直接在生产数据库上执行任何 Prisma 命令
- 所有数据库更改都应该通过数据库管理工具进行
- 在执行任何数据库操作前，确保已经备份数据
- 如果遇到需要执行 Prisma 命令的情况，请联系数据库管理员
