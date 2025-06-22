import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { content } = await req.json();

    // 验证内容
    if (!content) {
      return NextResponse.json({ error: '文档内容不能为空' }, { status: 400 });
    }

    // 检查文档是否存在
    const existingDoc = await prisma.t_document.findUnique({
      where: { id: params.id },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 更新文档
    await prisma.t_document.update({
      where: { id: params.id },
      data: { content, update_time: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存文档时发生错误:', error);
    return NextResponse.json({ error: '保存文档失败' }, { status: 500 });
  }
}
