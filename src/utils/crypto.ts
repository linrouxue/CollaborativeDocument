// utils/crypto.js
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string
// 初始化密钥
const KEY = Buffer.from(ENCRYPTION_KEY, 'utf8'); // 32字节密钥

// 加密（返回Base64URL）
export function encrypt(data : string) {
  const iv = randomBytes(12); // GCM推荐12字节
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')])
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 解密
export function decrypt(encrypted : string) {
  const data = Buffer.from(encrypted.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}