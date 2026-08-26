/** @type {import('next').NextConfig} */
const nextConfig = {
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
