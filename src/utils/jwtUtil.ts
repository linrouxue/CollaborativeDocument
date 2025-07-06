import { jwtVerify } from 'jose';

export class TokenParser {
  private token: string | null;

  constructor(request: Request);
  constructor(token: string);
  constructor(requestOrToken: Request | string) {
    if (typeof requestOrToken === 'string') {
      // 直接传入 token 字符串
      this.token = requestOrToken.startsWith('Bearer ')
        ? requestOrToken.substring(7)
        : requestOrToken;
    } else {
      // 传入 Request 对象
      let rawToken = requestOrToken.headers.get
        ? requestOrToken.headers.get('Authorization')
        : (requestOrToken.headers.get('Authorization') as string | undefined) || null;

      // 去除 Bearer 前缀
      this.token = rawToken?.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;
    }
  }

  /**
   * 校验并解析token，返回userId
   */
  async getUserId(): Promise<number | null> {
    // console.log("进来解析token")
    // console.log('this.token', this.token);
    if (this.token == null) return null;
    try {
      // console.log("开始解析token")
      // console.log("密钥：", process.env.JWT_SECRET)
      const JWT_SECRET = 'iEarbO7cnmDMqcUxVeojNChxlEYHcrdiyDDzL5QZ7Es=';
      // const JWT_SECRET = process.env.JWT_SECRET;
      const secret = new TextEncoder().encode(JWT_SECRET as string);
      //   console.log("secret", secret);
      const { payload } = await jwtVerify(this.token, secret);
      //   console.log('payload', payload);
      return payload.userId as number;
    } catch (e) {
      console.log('解析token失败', e);
      return null;
    }
  }

  /**
   * 获取原始token
   */
  getToken(): string | null {
    return this.token;
  }
}
