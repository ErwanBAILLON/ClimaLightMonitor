import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 flex items-center">
      {icon && (
        <div className="p-4 bg-gray-100 rounded-full">
          {icon}
        </div>
      )}
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default Card;
