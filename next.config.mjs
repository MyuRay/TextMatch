/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // プリレンダリングエラーを回避
  generateStaticParams: async () => [],
  // 404ページの静的生成を無効化
  trailingSlash: false,
}

export default nextConfig
