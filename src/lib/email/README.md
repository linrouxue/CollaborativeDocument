# 邮件服务配置说明

## 环境变量配置
```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# 邮件服务配置 (QQ邮箱示例)
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-email-authorization-code

# 其他配置
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## QQ邮箱配置步骤

1. **开启SMTP服务**
   - 登录QQ邮箱
   - 进入"设置" → "账户"
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启"POP3/SMTP服务"

2. **获取授权码**
   - 开启服务后，点击"生成授权码"
   - 按照提示操作，获取16位授权码
   - 将授权码填入 `SMTP_PASS` 环境变量

3. **配置说明**
   - `SMTP_HOST`: QQ邮箱SMTP服务器地址
   - `SMTP_PORT`: 端口号（587或465）
   - `SMTP_USER`: 您的QQ邮箱地址
   - `SMTP_PASS`: 邮箱授权码（不是登录密码）

## 其他邮箱配置

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 163邮箱
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=587
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code
```

### 企业邮箱
```env
SMTP_HOST=smtp.your-company.com
SMTP_PORT=587
SMTP_USER=your-email@your-company.com
SMTP_PASS=your-password
```

## 注意事项

1. **安全性**: 不要将 `.env.local` 文件提交到版本控制系统
2. **授权码**: 使用邮箱授权码而不是登录密码
3. **端口**: 根据邮箱服务商选择合适的端口
4. **测试**: 配置完成后可以测试发送验证码功能

## 故障排除

1. **连接失败**: 检查SMTP配置和网络连接
2. **认证失败**: 确认邮箱和授权码正确
3. **发送失败**: 检查邮箱是否开启了SMTP服务 