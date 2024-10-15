import Link from 'next/link';
import "tailwindcss/tailwind.css";
import { FC } from 'react';

const Home: FC = () => {
  return (
    <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
      
      {/* Animation d'arrière-plan avec des éléments représentant la technologie */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
        <div className="w-96 h-96 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-2xl animate-ping"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 text-center text-white">
        {/* Titre stylé pour ClimaLightMonitor */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">ClimaLight</span>Monitor
        </h1>
        <p className="mt-4 text-lg md:text-2xl font-light text-gray-300">
          Surveillez la température, l&apos;humidité et la luminosité en temps réel
        </p>

        {/* Bouton stylé avec animation */}
        <Link href="/dashboard">
          <a className="relative inline-block mt-8 px-10 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50">
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-60 blur-lg"></span>
            <span className="relative z-10">Accéder au Dashboard</span>
          </a>
        </Link>
      </div>

      {/* Effet de particules technologiques */}
      <div className="absolute inset-0 flex items-center justify-center space-x-8">
        <div className="w-56 h-56 border-4 border-green-400 rounded-full animate-spin-slow opacity-20"></div>
        <div className="w-40 h-40 border-4 border-blue-500 rounded-full animate-pulse opacity-30"></div>
        <div className="w-32 h-32 border-4 border-yellow-500 rounded-full animate-spin opacity-50"></div>
      </div>
    </div>
  );
};

export default Home;
