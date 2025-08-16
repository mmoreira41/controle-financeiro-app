import React, { useState } from 'react'
import { User, LogOut, Settings, ChevronDown, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export const UserProfile: React.FC = () => {
  const { user, signOut, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getUserDisplayName = () => {
    // Tentar pegar o nome do user_metadata primeiro
    const nomeCompleto = user.user_metadata?.nome_completo
    if (nomeCompleto) return nomeCompleto

    // Fallback para email até o @
    const emailName = user.email?.split('@')[0]
    return emailName || 'Usuário'
  }

  const getInitials = () => {
    const name = getUserDisplayName()
    const words = name.split(' ')
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="relative">
      {/* User Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
        disabled={loading}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {getInitials()}
        </div>
        
        {/* User Info */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {getUserDisplayName()}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {user.email}
          </p>
        </div>
        
        {/* Dropdown Arrow */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  // TODO: Implementar página de configurações
                  console.log('Abrir configurações')
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false)
                  handleSignOut()
                }}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {loading ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserProfile