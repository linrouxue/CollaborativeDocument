/**字段级别校验规则配置中心
 * 搭配 schemaBuilder.ts 使用
 */
import { z } from 'zod';

export const emailField = z.string().email({ message: '邮箱格式不正确' });

export const passwordField = z.string().min(6, { message: '密码至少 6 位' });

export const usernameField = z
  .string()
  .min(2, { message: '用户名至少 2 位' })
  .max(20, { message: '用户名最多 20 位' });

export const phoneField = z.string().regex(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' });

export const codeField = z.string().length(6, { message: '验证码应为 6 位数字' });
