// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

//用 Node.js 内置的 crypto 模块，创建一个 SHA-256 哈希对象。SHA-256 是一种常用的安全哈希算法
function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // 验证 refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // 2. 对 refreshToken 做哈希
    const hashedToken = hashToken(refreshToken);

    // 查找数据库，允许多条未吊销、未过期的 token
    const tokenRecord = await prisma.t_refresh_token.findFirst({
      where: {
        hashed_token: hashedToken,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      include: { t_user: true },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found or expired' },
        { status: 401 }
      );
    }

    // 生成新 accessToken 和 refreshToken
    const user = tokenRecord.t_user;
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        jti: crypto.randomUUID(),
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );
    const newJti = crypto.randomUUID();
    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        jti: newJti,
      },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: '7d',
      }
    );

    // 计算新刷新令牌的哈希值
    const newHashedToken = hashToken(newRefreshToken);

    // 创建新令牌记录（不吊销旧的）
    await prisma.t_refresh_token.create({
      data: {
        hashed_token: newHashedToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        jti: newJti,
        is_revoked: false,
      },
    });

    // 限制每个用户最多保留10条未过期、未吊销的 refreshToken，超出部分删除
    const tokens = await prisma.t_refresh_token.findMany({
      where: {
        user_id: user.id,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { expires_at: 'asc' },
      select: { id: true },
    });
    if (tokens.length > 10) {
      const deleteIds = tokens.slice(0, tokens.length - 10).map((t) => t.id);
      await prisma.t_refresh_token.deleteMany({ where: { id: { in: deleteIds } } });
    }
    // 创建响应
    const response = NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'self'",
        },
      }
    );
    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
