import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenParser } from '@/utils/jwtUtil';

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const tokenParser = new TokenParser(request);
    const userId = await tokenParser.getUserId();
    
    if (!userId) {
      return NextResponse.json({ success: false, message: '未提供 accessToken' }, { status: 401 });
    }

    // 获取请求体参数
    const body = await request.json();
    const { recentAccessIds } = body;
    console.log('recentAccessIds接口', recentAccessIds);

    // 验证参数
    if (!recentAccessIds || !Array.isArray(recentAccessIds) || recentAccessIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '请提供要删除的最近访问记录ID列表' 
      }, { status: 400 });
    }

    // 验证所有recentAccessId都是数字
    if (!recentAccessIds.every(id => typeof id === 'number' && Number.isInteger(id) && id >= 0)) {
      return NextResponse.json({ 
        success: false, 
        message: '最近访问记录ID必须是正整数' 
      }, { status: 400 });
    }

    // 批量删除recentAccess记录（软删除，设置del_flag为1）
    const deleteResult = await prisma.t_recent_access.updateMany({
      where: {
        id: {
          in: recentAccessIds
        },
        user_id: userId,
        del_flag: 0 // 只删除未删除的记录
      },
      data: {
        del_flag: 1,
        update_time: new Date()
      }
    });

    console.log(`用户 ${userId} 删除了 ${deleteResult.count} 条最近访问记录`);

    return NextResponse.json({
      success: true,
      message: `成功删除 ${deleteResult.count} 条最近访问记录`,
      data: {
        deletedCount: deleteResult.count
      }
    }, { status: 200 });

  } catch (error) {
    console.error('删除最近访问记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除最近访问记录失败，请重试'
    }, { status: 500 });
  }
}