import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenParser } from '@/utils/jwtUtil';

interface RecentAccessItem {
  key: number;
  documentId: number;
  knowledgeBaseId: number | null;
  knowledgeBaseName: string;
  name: string | null;
  // description: string;
  // 所属成员
  members: string[];
  openTime: number;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export async function GET(request: NextRequest) {
  try {
    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 参数验证
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return NextResponse.json(
        { success: false, message: '无效的分页参数' },
        { status: 400 }
      );
    }

    const tokenParser = new TokenParser(request);
    const userId = await tokenParser.getUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未提供 accessToken' },
        { status: 401 }
      );
    }

    // 获取总记录数
    const total = await prisma.t_recent_access.count({
      where: {
        user_id: userId,
        del_flag: 0,
      },
    });

    // 分页查询最近访问记录
    const recentAccess = await prisma.t_recent_access.findMany({
      where: {
        user_id: userId,
        del_flag: 0,
      },
      orderBy: {
        access_time: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取所有相关的文档ID
    const documentIds = recentAccess.map(item => item.document_id);

    // 批量查询文档信息
    const documents = await prisma.t_document.findMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      select: {
        id: true,
        knowledge_base_id: true,
        user_id: true,
        title: true,
      },
    });

    // 获取所有知识库ID和用户ID
    const kbIds = documents
      .map(doc => doc.knowledge_base_id)
      .filter((id): id is number => id !== null);
    const userIds = documents.map(doc => doc.user_id);

    // 并行查询知识库和用户信息
    const [knowledgeBases, users] = await Promise.all([
      prisma.t_knowledge_base.findMany({
        where: {
          id: {
            in: kbIds,
          },
        },
      }),
      prisma.t_user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      }),
    ]);

    // 创建查找映射以提高性能
    const documentMap = new Map(documents.map(doc => [doc.id, doc]));
    const kbMap = new Map(knowledgeBases.map(kb => [kb.id, kb]));
    const userMap = new Map(users.map(user => [user.id, user]));

    // 组装返回数据
    const recentAccessList = recentAccess.map(item => {
      const document = documentMap.get(item.document_id);
      if (!document) return null;

      const kb = document.knowledge_base_id ? kbMap.get(document.knowledge_base_id) : null;
      const user = userMap.get(document.user_id);

      return {
        key: item.id,
        documentId: item.document_id,
        knowledgeBaseId: document.knowledge_base_id,
        knowledgeBaseName: kb?.name ?? '',
        name: document.title,
        members: [user?.username ?? ''],
        openTime: item.access_time.getTime(),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      success: true,
      data: recentAccessList,
      total,
      page,
      pageSize,
    }, { status: 200 });
    
  } catch (error) {
    console.error('获取最近访问记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据失败' },
      { status: 500 }
    );
  }
}
