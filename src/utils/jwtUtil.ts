import { jwtVerify } from 'jose';

export class TokenParser {
  private token: string | null;

  constructor(request: Request) {
    // 兼容 Next.js/Express/Node 原生 Request
    this.token = request.headers.get
      ? request.headers.get('accessToken')
      : (request.headers.get('accessToken') as string | undefined) || null;
    // console.log('token', this.token);
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
      const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    //   console.log("secret", secret);
      const { payload } = await jwtVerify(this.token, secret);
    //   console.log('payload', payload);
      return payload.userId as number;
    } catch (e) {
        console.log("解析token失败", e)
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
