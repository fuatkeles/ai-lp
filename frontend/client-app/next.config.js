const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  env: {
    CUSTOM_KEY: 'client-app',
  },
  webpack: (config) => {
    // Add alias for shared components
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../../shared');
    
    // Handle JSX files in shared directory
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      include: [path.resolve(__dirname, '../../shared')],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
        },
      },
    });
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  experimental: {
    proxyTimeout: 180000, // 3 minutes timeout for proxy requests
  },
};

module.exports = nextConfig;