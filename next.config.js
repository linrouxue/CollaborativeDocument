/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ant-design/pro-components'],
  compiler: {
    styledComponents: true,
  },
  experimental: {
    optimizeCss: true,
    cssModules: true,
    optimizePackageImports: ['@ant-design/icons', '@ant-design/pro-components'],
  },
  // 禁用 Google Fonts 功能
  optimizeFonts: false
}

module.exports = nextConfig 