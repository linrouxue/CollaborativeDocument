import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      await prisma.t_refresh_token.updateMany({
        where: { hashed_token: hashedToken },
        data: { is_revoked: true },
      });
    }
    // 清除 Cookie
    const response = NextResponse.json({ success: true, message: '退出登录成功' });
    response.cookies.set({
      name: 'refreshToken',
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/api/auth',
    });
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, message: '退出登录失败' }, { status: 500 });
  }
}
