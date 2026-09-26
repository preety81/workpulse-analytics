/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: 'dist',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
