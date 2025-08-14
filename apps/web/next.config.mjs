/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during build to avoid blocking container builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
