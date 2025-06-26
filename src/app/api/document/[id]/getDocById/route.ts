import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/utils/permissionCheck';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 校验权限
  const { pass, response, user, minPermission, document } = await checkPermission(request);
  // 不通过直接返回
  if (!pass) return response;
  try {
    const id = parseInt(params.id);
    if (!id) {
      return new NextResponse('Missing document id', { status: 400 });
    }
    const doc = await prisma.t_document.findUnique({
      where: { id },
      select: { content: true }
    });

    if (!doc || !doc.content) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(doc.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="doc-${id}.bin"`
      }
    });
  } catch (e) {
    console.error('Error fetching document binary:', e);
    return new NextResponse('Server error', { status: 500 });
  }
}
