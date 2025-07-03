import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/utils/permissionCheck';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. 权限校验
  const { pass, response } = await checkPermission(request);
  if (!pass) return response;

  try {
    const id = parseInt(params.id);
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing document id' }, { status: 400 });
    }

    // 2. 读取二进制内容
    const buffer = Buffer.from(await request.arrayBuffer());

    // 3. 保存到数据库
    await prisma.t_document.update({
      where: { id },
      data: { content: buffer, update_time: new Date() },
    });

    // 4. 返回保存结果
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error saving document binary:', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
