/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com', 'books.google.com', 'books.google.co.jp'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // ビルド時にadmin関連ファイルを除外
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './app/admin/**/*',
        './app/api/admin/**/*',
        './lib/adminAuth.ts',
        './lib/adminFirestore.ts',
      ],
    },
  },
  // webpack設定でadminフォルダを除外
  webpack: (config, { isServer }) => {
    // adminフォルダを除外
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /node_modules/,
        /app\/admin/,
        /api\/admin/,
        /lib\/adminAuth\.ts$/,
        /lib\/adminFirestore\.ts$/,
      ],
    })
    
    return config
  },
}

export default nextConfig
