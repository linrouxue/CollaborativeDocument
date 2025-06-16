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
}

module.exports = nextConfig 