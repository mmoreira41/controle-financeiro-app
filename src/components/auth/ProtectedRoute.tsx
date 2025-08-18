import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from './LoginModal'
import { Lock, User, Shield, Database } from 'lucide-react'

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
          <div className="mt-2 text-xs text-gray-500">
            Conectando com Supabase
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated, show protected content
  if (user) {
    console.log('✅ ProtectedRoute: Usuário autenticado, exibindo conteúdo protegido')
    return <>{children}</>
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  console.log('🔒 ProtectedRoute: Usuário não autenticado, exibindo tela de login')

  // Default authentication required screen
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Sistema Protegido
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Para acessar o sistema financeiro, você precisa estar autenticado.
            <br />
            <span className="font-medium text-blue-600">
              Faça login ou crie sua conta gratuitamente.
            </span>
          </p>

          {/* Login Button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3 font-medium text-lg shadow-md hover:shadow-lg"
          >
            <User size={24} />
            Acessar Sistema
          </button>

          {/* Features List */}
          <div className="mt-10 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              🚀 Sistema Completo com Supabase
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-green-500 font-bold text-lg">✓</span>
                <div>
                  <div className="font-medium text-gray-900">Autenticação Segura</div>
                  <div className="text-sm text-gray-600">Login, cadastro e reset de senha</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-500 font-bold text-lg">✓</span>
                <div>
                  <div className="font-medium text-gray-900">Banco de Dados Real</div>
                  <div className="text-sm text-gray-600">Dados salvos no Supabase</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-500 font-bold text-lg">✓</span>
                <div>
                  <div className="font-medium text-gray-900">33 Categorias Automáticas</div>
                  <div className="text-sm text-gray-600">Entrada, saída e investimentos</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-500 font-bold text-lg">✓</span>
                <div>
                  <div className="font-medium text-gray-900">Múltiplas Contas</div>
                  <div className="text-sm text-gray-600">Gerencie todas suas contas</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <span className="text-indigo-500 font-bold text-lg">✓</span>
                <div>
                  <div className="font-medium text-gray-900">Sincronização em Tempo Real</div>
                  <div className="text-sm text-gray-600">Atualizações instantâneas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded-lg text-left">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} />
                <span className="font-medium text-gray-700">Debug Info</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>🔧 Development Mode</div>
                <div>🔒 User: {user ? 'Autenticado' : 'Não autenticado'}</div>
                <div>⏳ Loading: {loading ? 'Sim' : 'Não'}</div>
                <div>🌐 Supabase: Configurado</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}