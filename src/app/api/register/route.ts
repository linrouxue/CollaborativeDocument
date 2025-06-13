// 1. 导入 PrismaClient
import { PrismaClient } from '@/generated/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

// 2. 创建 Prisma 实例（全局复用推荐写法）
const prisma = new PrismaClient();

// 3. 接口函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允许 POST 请求' });
  }

  const { email, password } = req.body;

  // 4. 参数校验
  if (!email || !password) {
    return res.status(400).json({ message: '邮箱和密码不能为空' });
  }

  try {
    // 5. 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: '邮箱已注册' });
    }

    // 6. 创建新用户（密码未加密，仅示例）
    const newUser = await prisma.user.create({
      data: {
        email,
        password, // 正式项目中请加密！！
      },
    });

    // 7. 返回成功
    return res.status(201).json({ user: { id: newUser.id, email: newUser.email } });

  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}