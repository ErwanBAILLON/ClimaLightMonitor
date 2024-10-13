import { useState } from 'react';
import { FiMenu } from 'react-icons/fi'; // Import d'une icône pour le menu
import "tailwindcss/tailwind.css";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        {/* Titre du Dashboard */}
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      </div>

      {/* Section des boutons de droite */}
      <div className="flex items-center space-x-4">
        {/* Bouton Déconnexion */}
        <button className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-300">
          Déconnexion
        </button>

        {/* Bouton de Menu (Responsive) */}
        <div className="relative">
          <button
            onClick={toggleMenu}
            className="text-gray-800 hover:text-gray-600 focus:outline-none lg:hidden"
          >
            <FiMenu className="text-2xl" />
          </button>

          {/* Menu déroulant pour les options supplémentaires (mobile) */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-20">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Option 1
              </a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Option 2
              </a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Option 3
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
