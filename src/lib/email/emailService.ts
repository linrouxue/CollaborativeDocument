import * as nodemailer from 'nodemailer';

// 邮件配置
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.qq.com', // QQ邮箱SMTP服务器
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '', // 发件人邮箱
    pass: process.env.SMTP_PASS || '', // 邮箱授权码（不是登录密码）
  },
};

// 创建邮件传输器
const transporter = nodemailer.createTransport(emailConfig);

// 发送验证码邮件
export async function sendCaptchaEmail(to: string, captcha: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"协同文档平台" <${emailConfig.auth.user}>`,
      to: to,
      subject: '验证码 - 协同文档平台',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">协同文档平台</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">您的验证码</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; text-align: center;">验证码</h2>
            
            <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #1890ff; letter-spacing: 8px;">${captcha}</span>
            </div>
            
            <p style="color: #666; margin: 20px 0; line-height: 1.6;">
              您的验证码是：<strong style="color: #1890ff;">${captcha}</strong>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⚠️ 验证码有效期为10分钟，请尽快使用。<br>
                ⚠️ 如非本人操作，请忽略此邮件。
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              此邮件由系统自动发送，请勿回复。<br>
              如有问题，请联系客服。
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('发送验证码邮件失败:', error);
    return false;
  }
}

// 验证邮件配置
export function validateEmailConfig(): boolean {
  return !!(emailConfig.auth.user && emailConfig.auth.pass);
}
