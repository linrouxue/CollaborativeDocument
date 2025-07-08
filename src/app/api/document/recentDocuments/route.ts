import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenParser } from '@/utils/jwtUtil';
import { RecentDocument } from '@/types/document';

export async function GET(request: NextRequest) {
  try {
    const tokenParser = new TokenParser(request);
    const userId = await tokenParser.getUserId();

    if (!userId) {
      return NextResponse.json({ success: false, message: '未提供 accessToken' }, { status: 401 });
    }

    // 查询最近访问记录，不分页
    const recentAccess = await prisma.t_recent_access.findMany({
      where: {
        user_id: userId,
        del_flag: 0,
      },
      orderBy: {
        access_time: 'desc',
      },
      take: 20, // 限制返回20条记录
    });

    // 获取所有相关的文档ID
    const documentIds = recentAccess.map((item) => item.document_id);

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
      .map((doc) => doc.knowledge_base_id)
      .filter((id): id is number => id !== null);
    const userIds = documents.map((doc) => doc.user_id);

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
    const documentMap = new Map(documents.map((doc) => [doc.id, doc]));
    const kbMap = new Map(knowledgeBases.map((kb) => [kb.id, kb]));
    const userMap = new Map(users.map((user) => [user.id, user]));

    // 组装返回数据，符合RecentDocument接口
    const recentDocuments = recentAccess
      .map((item) => {
        const document = documentMap.get(item.document_id);
        if (!document) return null;

        const kb = document.knowledge_base_id ? kbMap.get(document.knowledge_base_id) : null;
        const user = userMap.get(document.user_id);

        // 格式化时间
        const openTime = formatTime(item.access_time.getTime());

        return {
          key: String(item.document_id), // 转为字符串以符合接口
          name: document.title || '未命名文档',
          knowledgeBase: kb?.name || '',
          knowledgeBaseId: document.knowledge_base_id,
          member: user?.username || '',
          openTime,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json(
      {
        success: true,
        data: recentDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取最近文档失败:', error);
    return NextResponse.json({ success: false, message: '获取数据失败' }, { status: 500 });
  }
}

function formatTime(ts: number) {
    if (!ts) return '-';
    // 使用 UTC 时间
    const date = new Date(ts);
    const now = new Date();
  
    // 转换为 UTC 时间进行比较
    const isToday =
      date.getUTCDate() === now.getUTCDate() &&
      date.getUTCMonth() === now.getUTCMonth() &&
      date.getUTCFullYear() === now.getUTCFullYear();
  
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    const isYesterday =
      date.getUTCDate() === yesterday.getUTCDate() &&
      date.getUTCMonth() === yesterday.getUTCMonth() &&
      date.getUTCFullYear() === yesterday.getUTCFullYear();
  
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  
    if (isToday) {
      return `今天 ${timeStr}`;
    } else if (isYesterday) {
      return `昨天 ${timeStr}`;
    } else if (date.getUTCFullYear() === now.getUTCFullYear()) {
      return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${timeStr}`;
    } else {
      return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${timeStr}`;
    }
  }
