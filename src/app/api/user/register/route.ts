import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyCaptcha } from '../send-captcha/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, captcha } = await request.json();
    console.log('收到注册请求，邮箱:', email);

    // 验证必填字段
    if (!email || !password || !confirmPassword || !captcha) {
      console.log('必填字段验证失败');
      return NextResponse.json({ success: false, message: '请填写所有必填字段' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('邮箱格式验证失败:', email);
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证密码
    if (password.length < 6 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      console.log('密码强度验证失败');
      return NextResponse.json(
        { success: false, message: '密码至少6位且必须包含字母和数字' },
        { status: 400 }
      );
    }

    // 验证确认密码
    if (password !== confirmPassword) {
      console.log('确认密码验证失败');
      return NextResponse.json(
        { success: false, message: '两次输入的密码不一致' },
        { status: 400 }
      );
    }

    // 验证验证码
    try {
      if (!(await verifyCaptcha(email, captcha))) {
        console.log('验证码验证失败');
        return NextResponse.json(
          { success: false, message: '验证码错误或已过期' },
          { status: 400 }
        );
      }
      console.log('验证码验证成功');
    } catch (captchaError) {
      console.error('验证码验证异常:', captchaError);
      return NextResponse.json(
        { success: false, message: '验证码验证失败，请重试' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    try {
      const existingUser = await (prisma as any).t_user.findFirst({
        where: { email },
      });

      if (existingUser) {
        console.log('邮箱已被注册:', email);
        return NextResponse.json({ success: false, message: '该邮箱已被注册' }, { status: 400 });
      }
      console.log('邮箱可用');
    } catch (userError) {
      console.error('查询用户时数据库错误:', userError);
      return NextResponse.json(
        { success: false, message: '查询用户信息失败，请重试' },
        { status: 500 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    try {
      const newUser = await (prisma as any).t_user.create({
        data: {
          email,
          password: hashedPassword,
          create_time: new Date(),
          update_time: new Date(),
          del_flag: 0,
        },
      });

      console.log('用户创建成功，ID:', newUser.id);
      return NextResponse.json(
        {
          success: true,
          message: '注册成功',
          user: { email },
        },
        {
          status: 200,
        }
      );
    } catch (createError) {
      console.error('创建用户时数据库错误:', createError);
      return NextResponse.json({ success: false, message: '注册失败，请重试' }, { status: 500 });
    }
  } catch (error) {
    console.error('注册失败，详细错误:', error);
    return NextResponse.json({ success: false, message: '注册失败，请重试' }, { status: 500 });
  }
}
