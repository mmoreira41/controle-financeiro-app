import React, { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nome, setNome] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { signIn, signUp, resetPassword } = useAuth()

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setNome('')
    setShowPassword(false)
    clearMessages()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    clearMessages()
    
    if (!email || !password) {
      setError('Email e senha são obrigatórios')
      return false
    }

    if (!email.includes('@')) {
      setError('Email deve ter formato válido')
      return false
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (!isLogin) {
      if (!nome.trim()) {
        setError('Nome é obrigatório para cadastro')
        return false
      }
      
      if (password !== confirmPassword) {
        setError('Senhas não coincidem')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Form submit:', isLogin ? 'LOGIN' : 'CADASTRO')
    }
    
    if (!validateForm()) return

    setLoading(true)
    clearMessages()

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro no login:', error.message)
          }
          setError(error.message)
        } else {
          setSuccess('Login realizado com sucesso!')
          setTimeout(handleClose, 1500)
        }
      } else {
        const { error } = await signUp(email, password, nome)
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro no cadastro:', error.message)
          }
          
          // 🔧 Tratamento específico de erros de cadastro
          if (error.message.includes('User already registered')) {
            setError('Este email já está cadastrado. Tente fazer login.')
          } else if (error.message.includes('Invalid API key')) {
            setError('Erro de configuração. Verifique as credenciais do Supabase.')
          } else {
            setError(error.message)
          }
        } else {
          setSuccess('Conta criada com sucesso! Você já pode fazer login.')
          setIsLogin(true)
          setPassword('')
          setConfirmPassword('')
        }
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('💥 Erro inesperado:', err)
      }
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Digite seu email para recuperar a senha')
      return
    }

    setLoading(true)
    clearMessages()

    try {
      const { error } = await resetPassword(email)
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Erro no reset:', error.message)
        }
        setError(error.message)
      } else {
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('💥 Erro no reset:', err)
      }
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
              <CheckCircle size={16} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Seu nome completo"
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                    placeholder="••••••••"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? '⏳ Processando...' : (isLogin ? '🔐 Entrar' : '✨ Criar Conta')}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-6 space-y-3">
            {isLogin && (
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 font-medium py-2"
              >
                🔑 Esqueci minha senha
              </button>
            )}

            <div className="text-center py-3 px-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              </span>
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  clearMessages()
                  setPassword('')
                  setConfirmPassword('')
                  setNome('')
                }}
                className="ml-2 text-sm text-blue-600 hover:text-blue-700 font-bold underline hover:no-underline transition-all"
              >
                {isLogin ? '✨ Criar conta' : '🔐 Fazer login'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}