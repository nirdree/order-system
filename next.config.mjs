/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'chart.js',
      'react-chartjs-2',
    ],
  },

  // Production source maps disabled for faster builds
  productionBrowserSourceMaps: false,

  // Output standalone for better Docker/production deployment
  output: 'standalone',

  // PoweredBy header removed for security
  poweredByHeader: false,

  // React strict mode for development
  reactStrictMode: true,
};

export default nextConfig;
