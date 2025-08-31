/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [],
    unoptimized: true,
    // Optimize image loading for PWA
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression and PWA optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Performance optimizations
  // experimental: {
  //   optimizeCss: true,
  // },
  webpack: (config, { dev, isServer }) => {
    // Polyfills for blockchain compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser"),
      "zlib": require.resolve("browserify-zlib"),
      "url": require.resolve("url/"),
      "crypto": require.resolve("crypto-browserify"),
    };

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      })
    );

    // Fix for Solana web3.js module parsing issues
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Performance optimizations for PWA
    if (!dev && !isServer) {
      // Enable tree shaking for better bundle sizes
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Bundle splitting optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Core UI libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 30,
            chunks: 'all',
          },
          // Solana blockchain libraries
          solana: {
            test: /[\\/]node_modules[\\/](@solana|@coral-xyz|@project-serum)[\\/]/,
            name: 'solana',
            priority: 25,
            chunks: 'all',
          },
          // Crypto and utility libraries
          crypto: {
            test: /[\\/]node_modules[\\/](@noble|crypto-browserify|buffer|stream)[\\/]/,
            name: 'crypto',
            priority: 20,
            chunks: 'all',
          },
          // Chart.js and visualization
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            priority: 15,
            chunks: 'all',
          },
          // PWA specific chunks
          pwa: {
            test: /[\\/](sw\.js|manifest\.json|pwa|offline)[\\/]/,
            name: 'pwa',
            priority: 35,
            chunks: 'all',
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
  // PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  // For static export
  output: 'export',
  distDir: 'build',
};

module.exports = withBundleAnalyzer(nextConfig);
