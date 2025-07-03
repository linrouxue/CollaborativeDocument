import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenParser } from '@/utils/jwtUtil';

interface RecentAccessItem {
  key: number;
  documentId: number;
  knowledgeBaseId: number;
  knowledgeBaseName: string;
  name: string | null;
  // description: string;
  // 所属成员
  members: string[];
  openTime: number;
}
export async function GET(request: NextRequest) {
  // 初始化返回数据容器
  const recentAccessList: RecentAccessItem[] = [];
  const tokenParser = new TokenParser(request);
  const userId = await tokenParser.getUserId();
  console.log('userId', userId);
  if (!userId) {
    return NextResponse.json({ success: false, message: '未提供 accessToken' }, { status: 401 });
  }
  const recentAccess = await prisma.t_recent_access.findMany({
    where: {
      user_id: userId,
      del_flag: 0,
    },
  });
  console.log('recentAccess', recentAccess);
  // 对recentAccess进行遍历
  let i = 0;
  for (const item of recentAccess) {
    // console.log("进来一次循环")
    const document = await prisma.t_document.findUnique({
      where: { id: item.document_id },
      select: {
        knowledge_base_id: true,
        user_id: true,
        title: true,
      },
    });
    // console.log('document', document);
    let knowledgeBaseName = null;
    if (document?.knowledge_base_id) {
      const kb = await prisma.t_knowledge_base.findUnique({
        where: { id: document.knowledge_base_id },
      });
      //   console.log('kb', kb);
      knowledgeBaseName = kb?.name ?? null;
      // 查询文档所属人姓名
      const user = await prisma.t_user.findUnique({
        where: { id: document.user_id },
      });
      //   console.log('user', user);
      const userName = user?.username ?? null;
      // 将各种信息封装成一个RecentAccessItem对象
      const recentAccessItem: RecentAccessItem = {
        key: item.id,
        documentId: item.document_id,
        knowledgeBaseId: document?.knowledge_base_id ?? null,
        knowledgeBaseName: knowledgeBaseName ?? '',
        name: document?.title ?? null,
        members: [userName ?? ''],
        openTime: item.access_time.getTime(),
      };
      //   console.log('recentAccessItem', recentAccessItem);
      //放进列表里面
      recentAccessList.push(recentAccessItem);
    }
  }
  //   console.log('recentAccessList', recentAccessList);
  return NextResponse.json({ success: true, data: recentAccessList }, { status: 200 });
}
