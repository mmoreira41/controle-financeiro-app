import React from 'react';
import { DollarSign } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 p-4">
      <div className="flex items-center space-x-2 mb-8">
        <DollarSign className="text-green-400" size={32} />
        <h1 className="text-2xl font-bold text-white">Lovable</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.id} className="mb-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`flex items-center space-x-3 p-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-green-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;