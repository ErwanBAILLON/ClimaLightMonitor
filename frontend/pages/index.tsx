import Link from 'next/link';
import "tailwindcss/tailwind.css";
import { FC } from 'react';

const Home: FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Link href="/dashboard">
        <a className="px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Aller au Dashboard
        </a>
      </Link>
    </div>
  );
};

export default Home;