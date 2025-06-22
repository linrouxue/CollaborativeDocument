import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendCaptchaEmail, validateEmailConfig } from '@/lib/email/emailService';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log('收到发送验证码请求，邮箱:', email);

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('邮箱格式验证失败:', email);
      return NextResponse.json({ success: false, message: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 邮件服务配置校验
    if (!validateEmailConfig()) {
      console.error('邮件配置不完整，请检查环境变量');
      return NextResponse.json({ success: false, message: '邮件服务配置错误，请联系管理员' }, { status: 500 });
    }

    // 防止频繁发送（1分钟内只能发一次）
    try {
      const recent = await (prisma as any).t_captcha.findFirst({
        where: {
          email,
          created_at: { gt: new Date(Date.now() - 60 * 1000) },
          expires_at: { gt: new Date() }
        }
      });
      if (recent) {
        console.log('检测到频繁发送验证码:', email);
        return NextResponse.json({ success: false, message: '请稍后再试，验证码发送过于频繁' }, { status: 429 });
      }
    } catch (dbError) {
      console.error('检查频繁发送验证码时数据库错误:', dbError);
    }

    // 生成验证码
    const captcha = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 发送邮件
    const emailSent = await sendCaptchaEmail(email, captcha);
    if (!emailSent) {
      console.error('邮件发送失败');
      return NextResponse.json({ success: false, message: '邮件发送失败，请重试' }, { status: 500 });
    }

    console.log('邮件发送成功，开始存储验证码到数据库...');
    // 删除旧验证码，插入新验证码
    try {
      await (prisma as any).t_captcha.deleteMany({ where: { email } });
      await (prisma as any).t_captcha.create({
        data: { email, captcha, expires_at: expiresAt }
      });

      // 清理过期验证码
      await (prisma as any).t_captcha.deleteMany({
        where: { expires_at: { lt: new Date() } }
      });

      console.log('验证码存储成功');
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      // 如果数据库操作失败，仍然返回成功（因为邮件已经发送）
      console.log('数据库存储失败，但邮件已发送，继续执行');
    }

    return NextResponse.json({ success: true, message: '验证码已发送到您的邮箱' });
  } catch (error) {
    console.error('发送验证码失败，详细错误:', error);
    return NextResponse.json({ success: false, message: '发送验证码失败，请重试' }, { status: 500 });
  }
}

// 验证验证码的函数（供其他API使用）
export async function verifyCaptcha(email: string, captcha: string): Promise<boolean> {
  try {
    console.log('开始验证验证码:', { email, captcha });
    
    const prisma = new PrismaClient();
    
    // 查询验证码
    const record = await (prisma as any).t_captcha.findFirst({
      where: {
        email,
        captcha,
        expires_at: { gt: new Date() }
      }
    });
    
    if (record) {
      console.log('验证码验证成功，记录ID:', record.id);
      // 删除验证码（一次性使用）
      try {
        await (prisma as any).t_captcha.delete({ where: { id: record.id } });
        console.log('验证码已删除');
      } catch (deleteError) {
        console.error('删除验证码失败:', deleteError);
        // 即使删除失败，验证码仍然有效
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