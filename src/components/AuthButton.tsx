import React, { useState } from 'react'
import { LogIn, LogOut, User, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './LoginModal'

export const AuthButton: React.FC = () => {
  const { user, signOut, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    
    // Tentar extrair nome do email (parte antes do @)
    if (user.email) {
      const emailName = user.email.split('@')[0]
      // Capitalizar primeira letra
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    
    return 'Usuário'
  }

  // Se está carregando estado inicial, mostrar loading
  if (loading && !user) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    )
  }

  // Se usuário logado, mostrar informações e botão de logout
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Informações do usuário */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-right">
            <div className="font-medium text-gray-900">{getUserDisplayName()}</div>
            <div className="text-xs text-gray-500 max-w-32 truncate">
              {user.email}
            </div>
          </div>
        </div>

        {/* Avatar apenas no mobile */}
        <div className="sm:hidden">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Botão de logout */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sair"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    )
  }

  // Se não logado, mostrar botão de login
  return (
    <>
      <button
        onClick={() => setShowLoginModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <LogIn className="w-4 h-4" />
        <span>Entrar</span>
      </button>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  )
}