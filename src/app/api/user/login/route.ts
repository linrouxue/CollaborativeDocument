import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json({ success: false, message: '邮箱和密码不能为空' }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.t_user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 });
    }

    // 生成 access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' } // 15 分钟
    );

    // 生成 refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // 7 天
    );

    const hashedToken = hashToken(refreshToken);
    await prisma.t_refresh_token.create({
      data: {
        hashed_token: hashedToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 使用 NextResponse 统一处理
    const response = NextResponse.json(
      {
        success: true,
        accessToken,
      },
      { status: 200 }
    );

    // 安全设置 Cookie
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: '登录失败，请重试' }, { status: 500 });
  }
}
