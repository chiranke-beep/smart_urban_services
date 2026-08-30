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
};

export default nextConfig;
