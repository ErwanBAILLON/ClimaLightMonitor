// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  // Ajoute d'autres configurations spécifiques à Next.js ici
};

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // Autres options spécifiques à next-pwa, comme `exclude`, peuvent être ajoutées ici
};

export default withPWA(pwaConfig)(nextConfig);