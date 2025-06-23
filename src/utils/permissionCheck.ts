import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

// 权限映射关系
const requiredPermissionMap: { [url: string]: number } = {
  '/api/permission': 3,
  '/api/admin/document/update': 3,
  '/api/admin/document/delete': 3,
  // 其他API路径及所需权限
};

export async function checkPermission(request: NextRequest) {
  // 1. 获取token
  const token = request.headers.get('accessToken');
  console.log('[权限校验] accessToken:', token);
  if (!token) {
    console.log('[权限校验] 未登录，缺少token');
    return { pass: false, response: NextResponse.json({ success: false, message: '未登录' }, { status: 401 }) };
  }

  // 2. 校验token
  let userId: number;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as number;
    console.log('[权限校验] token校验通过，userId:', userId);
  } catch (e) {
    console.log('[权限校验] token无效', e);
    return { pass: false, response: NextResponse.json({ success: false, message: 'token无效' }, { status: 401 }) };
  }

  // 3. 查用户
  const user = await prisma.t_user.findUnique({ where: { id: userId } });
  console.log('[权限校验] 查询用户:', user);
  if (!user) {
    console.log('[权限校验] 用户不存在');
    return { pass: false, response: NextResponse.json({ success: false, message: '无权限访问' }, { status: 403 }) };
  }

  // 4. 获取文档id
  const documentId = request.nextUrl.searchParams.get('documentId');
  console.log('[权限校验] documentId:', documentId);
  if (!documentId) {
    console.log('[权限校验] 缺少文档id');
    return { pass: false, response: NextResponse.json({ success: false, message: '无权限访问' }, { status: 403 }) };
  }

  // 5. 查文档
  const document = await prisma.t_document.findUnique({
    where: { id: parseInt(documentId) }
  });
  console.log('[权限校验] 查询文档:', document);
  if (!document) {
    console.log('[权限校验] 文档不存在');
    return { pass: false, response: NextResponse.json({ success: false, message: '无权限访问' }, { status: 403 }) };
  }

  // 6. 查祖先文档
  const ancestorDocumentId: number[] = [];
  let tempDocument = document;
  while (tempDocument.parent_id) {
    ancestorDocumentId.push(tempDocument.parent_id);
    const parentDoc = await prisma.t_document.findUnique({
      where: { id: tempDocument.parent_id, user_id: userId }
    });
    if (!parentDoc) break;
    tempDocument = parentDoc;
  }
  console.log('[权限校验] 祖先文档ID:', ancestorDocumentId);

  // 7. 查权限
  const knowledgeBasePermission = await prisma.t_knowledge_base_permission.findMany({
    where: { knowledge_base_id: document.knowledge_base_id, user_id: userId }
  });
  const ancestorDocumentPermission = await prisma.t_document_permission.findMany({
    where: { document_id: { in: ancestorDocumentId }, user_id: userId }
  });
  const documentPermission = await prisma.t_document_permission.findMany({
    where: { document_id: parseInt(documentId), user_id: userId }
  });
  console.log('[权限校验] 知识库权限:', knowledgeBasePermission);
  console.log('[权限校验] 祖先文档权限:', ancestorDocumentPermission);
  console.log('[权限校验] 当前文档权限:', documentPermission);

  // 8. 合并权限
  const permissionList: number[] = [
    ...knowledgeBasePermission
      .map(item => item.permission)
      .filter((p): p is string => p !== null)
      .map(p => parseInt(p, 10))
      .filter(num => !isNaN(num)),
    ...ancestorDocumentPermission
      .map(item => item.permission)
      .filter((p): p is number => typeof p === 'number'),
    ...documentPermission
      .map(item => item.permission)
      .filter((p): p is number => typeof p === 'number')
  ];
  console.log('[权限校验] 权限列表:', permissionList);
  const minPermission = Math.min(...permissionList);
  console.log('[权限校验] 最小权限:', minPermission);

  // 9. 校验权限
  const url = request.nextUrl.pathname;
  const requiredPermission = requiredPermissionMap[url];
  console.log('[权限校验] 当前URL:', url, '所需权限:', requiredPermission);
  if (requiredPermission !== undefined && minPermission < requiredPermission) {
    console.log('[权限校验] 权限不足');
    return { pass: false, response: NextResponse.json({ success: false, message: '权限不足' }, { status: 403 }) };
  }

  // 10. 校验通过，返回用户和权限
  console.log('[权限校验] 权限校验通过');
  return { pass: true, user, minPermission, document };
}