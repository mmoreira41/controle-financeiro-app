import React from 'react'
import { Categoria } from '../hooks/useCategorias'

interface CategoriaItemProps {
  categoria: Categoria
  onClick?: () => void
  showBadges?: boolean
  className?: string
}

export const CategoriaItem: React.FC<CategoriaItemProps> = ({ 
  categoria, 
  onClick, 
  showBadges = true, 
  className = '' 
}) => {
  const isGlobal = categoria.user_id === null
  const isSistema = categoria.sistema === true
  
  return (
    <div 
      className={`flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''} ${className}`}
      onClick={onClick}
    >
      <span className="flex-1">{categoria.nome}</span>
      
      {showBadges && (
        <div className="flex gap-1 ml-2">
          {isGlobal && !isSistema && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              Global
            </span>
          )}
          
          {isSistema && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              Sistema
            </span>
          )}
          
          {!isGlobal && (
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
              Pessoal
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CategoriaItem