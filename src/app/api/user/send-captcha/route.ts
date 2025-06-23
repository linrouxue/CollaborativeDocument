import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCaptchaEmail, validateEmailConfig } from '@/lib/email/emailService';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const emailLower = email?.toLowerCase();

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailLower || !emailRegex.test(emailLower)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 邮件服务配置校验
    if (!validateEmailConfig()) {
      console.error('邮件配置不完整，请检查环境变量');
      return NextResponse.json(
        { success: false, message: '邮件服务配置错误，请联系管理员' },
        { status: 500 }
      );
    }

    // 防止频繁发送（1分钟内只能发一次）
    const recent = await prisma.t_captcha.findFirst({
      where: {
        email: emailLower,
        created_at: { gt: new Date(Date.now() - 60 * 1000) },
        expires_at: { gt: new Date() },
      },
    });
    if (recent) {
      return NextResponse.json(
        { success: false, message: '请稍后再试，验证码发送过于频繁' },
        { status: 429 }
      );
    }

    // 生成验证码
    const captcha = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 发送邮件
    const emailSent = await sendCaptchaEmail(emailLower, captcha);
    if (!emailSent) {
      console.error('邮件发送失败');
      return NextResponse.json(
        { success: false, message: '邮件发送失败，请重试' },
        { status: 500 }
      );
    }

    // 删除旧验证码，插入新验证码
    try {
      await prisma.t_captcha.deleteMany({ where: { email: emailLower } });
      await prisma.t_captcha.create({
        data: { email: emailLower, captcha, expires_at: expiresAt },
      });

      // 清理过期验证码
      await prisma.t_captcha.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });

      console.log('验证码存储成功');
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      return NextResponse.json(
        { success: false, message: '验证码存储失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送到您的邮箱',
    });
  } catch (error) {
    console.error('发送验证码失败，详细错误:', error);
    return NextResponse.json(
      { success: false, message: '发送验证码失败，请重试' },
      { status: 500 }
    );
  }
}

// 验证验证码的函数（供其他API使用）
export async function verifyCaptcha(email: string, captcha: string): Promise<boolean> {
  try {
    const emailLower = email.toLowerCase();
    const captchaStr = captcha.toString();

    // 查询验证码
    const record = await prisma.t_captcha.findFirst({
      where: {
        email: emailLower,
        captcha: captchaStr,
        expires_at: { gt: new Date() },
      },
    });

    if (record) {
      console.log('验证码验证成功，记录ID:', record.id);
      // 删除验证码（一次性使用）
      try {
        await prisma.t_captcha.delete({ where: { id: record.id } });
        console.log('验证码已删除');
      } catch (deleteError) {
        console.error('删除验证码失败:', deleteError);
      }
      return true;
    } else {
      console.log('验证码验证失败：未找到有效记录');
      return false;
    }
  } catch (error) {
    console.error('验证验证码时发生错误:', error);
    return false;
  }
}
