import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/utils/permissionCheck';
// GET 测试接口
export async function GET(request: NextRequest) {
  // 校验权限
  const { pass, response, user, minPermission, document } = await checkPermission(request);
  // 不通过直接返回
  if (!pass) return response;
  return NextResponse.json({ success: true, message: '权限测试接口正常工作' });
}

// POST 测试接口（可选）
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: body, message: 'POST 权限测试接口正常工作' });
}
