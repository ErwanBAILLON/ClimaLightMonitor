// import 'dotenv/config';
(async () => {
  const dotenv = await import('dotenv');
  dotenv.config();
})();
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
};

export default withPWA(pwaConfig)(nextConfig);
