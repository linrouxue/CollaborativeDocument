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

    // 1. 校验 JWT 签名和过期
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // 2. 对 refreshToken 做哈希
    const hashedToken = hashToken(refreshToken);

    // 3. 查找数据库
    const tokenRecord = await prisma.t_refresh_token.findUnique({
      where: { hashed_token: hashedToken },
      include: { t_user: true },
    });

    // 4. 判断是否存在
    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // 5. 判断是否已吊销
    if (tokenRecord.is_revoked) {
      // 安全事件：吊销所有令牌
      await prisma.t_refresh_token.updateMany({
        where: { user_id: tokenRecord.user_id },
        data: { is_revoked: true },
      });
      return NextResponse.json(
        { success: false, message: '检测到令牌重用，所有会话已终止，请重新登录' },
        { status: 401 }
      );
    }

    // 判断是否过期
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: '刷新令牌已过期' }, { status: 401 });
    }

    // 6. 正常流程：吊销旧 token
    await prisma.t_refresh_token.update({
      where: { id: tokenRecord.id },
      data: { is_revoked: true },
    });

    // 7. 生成新 accessToken 和 refreshToken
    const user = tokenRecord.t_user;
    const newAccessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '15m',
    });
    const newRefreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });
    const newHashedToken = hashToken(newRefreshToken);

    // 8. 存入数据库
    await prisma.t_refresh_token.create({
      data: {
        hashed_token: newHashedToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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
