/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ant-design/pro-components'],
  compiler: {
    styledComponents: true,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@ant-design/icons', '@ant-design/pro-components'],
  },
  typescript: {
    // !! 警告 !!
    // 在生产环境中忽略类型错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 在生产环境中忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
