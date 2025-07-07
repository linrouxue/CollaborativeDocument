import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const documentId = parseInt(params.id);

    if (isNaN(documentId)) {
      return NextResponse.json({ success: false, message: '无效的文档ID' }, { status: 400 });
    }

    // 查询文档信息，只获取知识库ID
    const document = await prisma.t_document.findUnique({
      where: {
        id: documentId,
        del_flag: 0,
      },
      select: {
        knowledge_base_id: true,
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, message: '文档不存在' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          knowledgeBaseId: document.knowledge_base_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取文档知识库ID失败:', error);
    return NextResponse.json({ success: false, message: '获取数据失败' }, { status: 500 });
  }
}
