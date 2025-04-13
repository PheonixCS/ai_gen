/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imageni.org',
      },
      {
        protocol: 'https',
        hostname: 'krazu-group.tech',
      },
    ],
  },
  // This setting prevents URLs with trailing slashes (important for static exports)
  trailingSlash: true,
};

export default nextConfig;
