import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: '缺少邮箱参数' }, { status: 400 });
    }
    const user = await prisma.t_user.findFirst({ where: { email } });
    return NextResponse.json({ success: true, exists: !!user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: '查询失败' }, { status: 500 });
  }
}
