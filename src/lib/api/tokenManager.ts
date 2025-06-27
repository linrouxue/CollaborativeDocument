// 模块上下文形式存储assessToken
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  // return accessToken;
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3d3cuYmVqc29uLmNvbSIsInN1YiI6ImFyeWEiLCJ1c2VySWQiOjQsImF1ZCI6ImtpbmEiLCJpYXQiOjE3NTA4NTQzMDAsImV4cCI6MTc4MjM5MDkwMCwiY2xhc3NpZCI6ImxxZTBhMWFpem0yMjVwZDVnbXJrZyJ9.eFH8bZ3ONzwHwptvIoreSW2ks0MfeqQkg_81MqwTjz8";
}
