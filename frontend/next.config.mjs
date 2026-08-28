/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone deployment
  output: "standalone",

  // Speed up Docker builds by skipping redundant checks on resource-constrained EC2
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/citizen/dashboard',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/citizen/register',
        permanent: false,
      },
      {
        source: '/register-provider',
        destination: '/provider/register',
        permanent: false,
      },
    ];
  },

  async rewrites() {
    const backendHost = process.env.INTERNAL_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:5000' : 'http://localhost:5000');
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendHost}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
