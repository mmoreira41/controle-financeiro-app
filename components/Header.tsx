import React, { useRef, useState, useEffect } from 'react';
import { Page } from '../types';
import { User, Pencil, Calendar, Search, Menu, Camera, Trash2 } from 'lucide-react';

interface HeaderProps {
  setCurrentPage: (page: Page) => void;
  profilePicture: string | null;
  onImageSelect: (imageSrc: string) => void;
  onImageRemove: () => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentPage, profilePicture, onImageSelect, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCalcMenuOpen, setIsCalcMenuOpen] = useState(false);
  const calcMenuRef = useRef<HTMLDivElement>(null);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const editMenuRef = useRef<HTMLDivElement>(null);


  const handleProfileClick = () => {
    setCurrentPage('perfil');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMenuOpen(prev => !prev);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
     // Reset file input to allow re-uploading the same file
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
    setIsEditMenuOpen(false);
  };

  const handleRemoveImage = () => {
    onImageRemove();
    setIsEditMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calcMenuRef.current && !calcMenuRef.current.contains(event.target as Node)) {
        setIsCalcMenuOpen(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
        setIsEditMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 flex-shrink-0 bg-gray-900/70 backdrop-blur-sm">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        {/* Left side: Profile Icon */}
        <div className="relative" ref={editMenuRef}>
            <button onClick={handleProfileClick} className="relative group">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                        <img src={profilePicture} alt="Foto de Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-gray-400" />
                    )}
                </div>
                <div 
                    onClick={handleEditClick}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white ring-2 ring-gray-900 cursor-pointer group-hover:bg-blue-600 transition-colors"
                    title="Alterar foto de perfil"
                    aria-haspopup="true"
                    aria-expanded={isEditMenuOpen}
                >
                    <Pencil size={12} />
                </div>
            </button>
            {isEditMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in-down">
                    <div className="p-2">
                        <button onClick={handleTriggerFileSelect} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                            <Camera size={16} />
                            <span>Alterar foto</span>
                        </button>
                        {profilePicture && (
                            <button onClick={handleRemoveImage} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-red-400 rounded-md hover:bg-gray-700">
                                <Trash2 size={16} />
                                <span>Remover foto</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => setCurrentPage('fluxo')} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors" aria-label="Calendário">
                <Calendar size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors" aria-label="Buscar">
                <Search size={20} />
            </button>
            <div className="relative" ref={calcMenuRef}>
                <button onClick={() => setIsCalcMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors" aria-label="Calculadoras">
                    <Menu size={20} />
                </button>
                {isCalcMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in-down">
                        <div className="p-2">
                            <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('calculadora-juros-compostos');
                                setIsCalcMenuOpen(false);
                            }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                                Calculadora de Juros Compostos
                            </a>
                             <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('calculadora-reserva-emergencia');
                                setIsCalcMenuOpen(false);
                            }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                                Calculadora de Reserva de Emergência
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;