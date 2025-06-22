import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyCaptcha } from '../send-captcha/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, captcha, newPassword, confirmPassword } = await request.json();

    // 验证必填字段
    if (!email || !captcha || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: '请填写所有必填字段' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证新密码
    if (newPassword.length < 6 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: '密码至少6位且必须包含字母和数字' },
        { status: 400 }
      );
    }

    // 验证确认密码
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: '两次输入的密码不一致' },
        { status: 400 }
      );
    }

    // 1. 检查用户是否存在
    let existingUser;
    try {
      existingUser = await (prisma as any).t_user.findFirst({
        where: { email },
      });

      if (!existingUser) {
        return NextResponse.json({ success: false, message: '该邮箱未注册' }, { status: 400 });
      }
    } catch (userError) {
      return NextResponse.json(
        { success: false, message: '查询用户信息失败，请重试' },
        { status: 500 }
      );
    }

    // 2. 验证验证码
    try {
      if (!(await verifyCaptcha(email, captcha))) {
        return NextResponse.json(
          { success: false, message: '验证码错误或已过期' },
          { status: 400 }
        );
      }
    } catch (captchaError) {
      return NextResponse.json(
        { success: false, message: '验证码验证失败，请重试' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    try {
      const result = await (prisma as any).t_user.update({
        where: { email },
        data: {
          password: hashedPassword,
          update_time: new Date(),
        },
      });

      return NextResponse.json({
        status: 200,
        success: true,
        message: '密码重置成功',
      });
    } catch (updateError) {
      return NextResponse.json(
        { success: false, message: '密码重置失败，请重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('密码重置失败，详细错误:', error);
    return NextResponse.json({ success: false, message: '密码重置失败，请重试' }, { status: 500 });
  }
}
