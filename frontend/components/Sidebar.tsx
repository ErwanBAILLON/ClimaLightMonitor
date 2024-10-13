import { FaHome, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import { FC } from 'react';

const Sidebar: FC = () => {
  return (
    <div className="w-64 h-screen bg-blue-600 text-white">
      <div className="p-4 text-2xl font-bold">Dashboard</div>
      <nav className="mt-10">
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
  );
};

export default Sidebar;