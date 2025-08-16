import React, { useState } from 'react'
import { Loader2, Lock, CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { LoginModal } from './LoginModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // DEBUG: Log estado atual sempre que mudar
  console.log('🔥 PROTECTED ROUTE - Estado atual:')
  console.log('- Loading:', loading)
  console.log('- User exists:', !!user)
  console.log('- User email:', user?.email)
  console.log('- Show login modal:', showLoginModal)

  // Enquanto carrega, mostrar loading
  if (loading) {
    console.log('🔥 PROTECTED ROUTE - MOSTRANDO LOADING')
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não tem usuário, mostrar tela de não autorizado
  if (!user) {
    console.log('🔥 PROTECTED ROUTE - SEM USUÁRIO, MOSTRANDO TELA DE LOGIN')
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Ícone */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>

              {/* Título */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Acesso Restrito
              </h1>

              {/* Descrição */}
              <p className="text-gray-600 mb-6">
                Para acessar seus dados financeiros, você precisa estar logado na sua conta.
              </p>

              {/* Features */}
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Controle completo das suas finanças
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Dados seguros e privados
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Sincronização entre dispositivos
                  </span>
                </div>
              </div>

              {/* Botão de login */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Entrar na Minha Conta
              </button>

              {/* Link para criar conta */}
              <p className="text-sm text-gray-500 mt-4">
                Não tem uma conta?{' '}
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Criar agora
                </button>
              </p>
            </div>
          </div>
        </div>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    )
  }

  // Se tem usuário, renderizar o conteúdo protegido
  console.log('✅ PROTECTED ROUTE - USUÁRIO AUTENTICADO, MOSTRANDO PLATAFORMA')
  console.log('✅ User:', user.email)
  return <>{children}</>
}

// Hook para verificar se está autenticado
export const useRequireAuth = () => {
  const { user, loading } = useAuth()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  }
}