import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </header>
  );
};

export default Header;
