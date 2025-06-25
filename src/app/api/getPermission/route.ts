// 获取访问能操作该文档的最大权限值
import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/utils/permissionCheck';
// GET 测试接口
export async function GET(request: NextRequest) {
    // 校验权限
    const { pass, response, user, minPermission, document } = await checkPermission(request);
    return NextResponse.json({ success: true, message: '成功返回该用户对该文档拥有的权限值', permission: minPermission }, {status: 200});

}
