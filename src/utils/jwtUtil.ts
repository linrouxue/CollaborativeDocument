import { jwtVerify } from 'jose';

export class TokenParser {
  private token: string | null;

  constructor(request: Request) {
    // 兼容 Next.js/Express/Node 原生 Request
    this.token = request.headers.get
      ? request.headers.get('accessToken')
      : (request.headers.get('accessToken') as string | undefined) || null;
  }

  /**
   * 校验并解析token，返回userId
   */
  async getUserId(): Promise<number | null> {
    if (!this.token) return null;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
      const { payload } = await jwtVerify(this.token, secret);
      return payload.userId as number;
    } catch (e) {
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
