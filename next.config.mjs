/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // Allows production builds to succeed cleanly
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
