// 模块上下文形式存储assessToken
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
  // return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ind3dy5iZWpzb24uY29tIiwic3ViIjoiZGVtbyIsInVzZXJJZCI6NCwiaWF0IjoxNzUxMTMwNTQ1LCJuYmYiOjE4NTExMzA1NDUsImV4cCI6MTc1MTIxNjk0NX0.I6DtrvuUUdfReGdxiwIrl558P3xXsh-lVq-U6tWf6DA";
}
