import React, { useRef, useState, useEffect } from 'react';
import { Page } from '../types';
import { User, Pencil, Calendar, Search, Menu, Camera, Trash2, Settings, TrendingUp, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../src/contexts/AuthContext';

interface HeaderProps {
  setCurrentPage: (page: Page, state?: { viewId: string; }) => void;
  profilePicture: string | null;
  onImageSelect: (imageSrc: string) => void;
  onImageRemove: () => void;
  onSearchClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ setCurrentPage, profilePicture, onImageSelect, onImageRemove, onSearchClick }) => {
  const { signOut } = useAuth();
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      setIsCalcMenuOpen(false);
      
      // Mostrar feedback visual
      const button = document.querySelector('[data-logout-btn]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Saindo...';
        button.disabled = true;
      }
      
      await signOut();
      console.log('✅ Logout concluído');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Restaurar botão em caso de erro
      const button = document.querySelector('[data-logout-btn]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Sair da Conta';
        button.disabled = false;
      }
    }
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
            <button onClick={onSearchClick} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors" aria-label="Buscar">
                <Search size={20} />
            </button>
            <div className="relative" ref={calcMenuRef}>
                <button onClick={() => setIsCalcMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors" aria-label="Calculadoras">
                    <Menu size={20} />
                </button>
                {isCalcMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in-down">
                        <div className="p-2">
                            <h4 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ajustes
                            </h4>
                            <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('perfil', { viewId: 'visualizacao' });
                                setIsCalcMenuOpen(false);
                            }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                                <Settings size={16} />
                                <span>Configurações</span>
                            </a>
                            <button 
                                onClick={handleLogout} 
                                data-logout-btn
                                className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-red-400 rounded-md hover:bg-gray-700 hover:text-red-300 transition-colors disabled:opacity-50"
                            >
                                <LogOut size={16} />
                                <span>Sair da Conta</span>
                            </button>
                            
                            <div className="border-t border-gray-700 my-1"></div>
                            
                            <h4 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Calculadoras
                            </h4>
                            <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('calculadora-juros-compostos');
                                setIsCalcMenuOpen(false);
                            }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                                <TrendingUp size={16} />
                                <span>Calculadora de Juros Compostos</span>
                            </a>
                             <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage('calculadora-reserva-emergencia');
                                setIsCalcMenuOpen(false);
                            }} className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white">
                                <Shield size={16} />
                                <span>Calculadora de Reserva de Emergência</span>
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
