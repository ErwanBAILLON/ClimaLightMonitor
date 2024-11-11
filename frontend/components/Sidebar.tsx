import { FaHome, FaChartLine, FaPowerOff } from 'react-icons/fa';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      {/* Bouton pour ouvrir/fermer la sidebar sur mobile */}
      <button
        onClick={toggleSidebar}
        className="text-white p-2 bg-blue-600 fixed top-2 left-2 z-30 md:hidden"
      >
        <FaHome className="text-2xl" />
      </button>

      {/* Sidebar responsive */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-blue-600 text-white transition-transform transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static z-20 overflow-y-auto flex flex-col justify-between`}>
        <div>
          <nav className="mt-4 flex flex-col space-y-4">
            <Link href="/">
              <a className="flex items-center px-4 py-2 hover:bg-blue-700">
                <FaHome className="mr-3" /> Accueil
              </a>
            </Link>
            <Link href="/dashboard">
              <a className="flex items-center px-4 py-2 hover:bg-blue-700">
                <FaChartLine className="mr-3" /> Dashboard
              </a>
            </Link>
          </nav>
        </div>

        {/* Bouton Déconnexion collé en bas */}
        <div className="p-4">
          <button className="w-full flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md transition duration-300 ease-in-out" onClick={handleLogout}>
            <FaPowerOff className="mr-3" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Overlay pour fermer la sidebar en cliquant à l'extérieur */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black opacity-50 z-10 md:hidden"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
