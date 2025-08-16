import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthMode, LoginFormData, SignUpFormData, ResetPasswordFormData } from '../types/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword, loading, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  
  const [signUpForm, setSignUpForm] = useState<SignUpFormData>({
    nomeCompleto: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [resetForm, setResetForm] = useState<ResetPasswordFormData>({
    email: ''
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Limpar formulários quando modal abrir/fechar
  useEffect(() => {
    if (!isOpen) {
      setLoginForm({ email: '', password: '' })
      setSignUpForm({ nomeCompleto: '', email: '', password: '', confirmPassword: '' })
      setResetForm({ email: '' })
      setFormErrors({})
      setMode('login')
      setShowPassword(false)
      setShowConfirmPassword(false)
      clearError()
    }
  }, [isOpen, clearError])

  // Limpar erros quando mudar de modo
  useEffect(() => {
    clearError()
    setFormErrors({})
  }, [mode, clearError])

  // Fechar modal quando usuário fizer login com sucesso
  useEffect(() => {
    console.log('🔥 MODAL EFFECT - Verificando se deve fechar modal')
    console.log('- User exists:', !!user)
    console.log('- User email:', user?.email)
    console.log('- Modal isOpen:', isOpen)
    
    if (user && isOpen) {
      console.log('✅ USUÁRIO LOGADO DETECTADO - FECHANDO MODAL')
      console.log('✅ Chamando onClose()...')
      onClose()
      console.log('✅ onClose() executado')
    } else if (user && !isOpen) {
      console.log('✅ USUÁRIO LOGADO MAS MODAL JÁ FECHADO')
    } else if (!user && isOpen) {
      console.log('❌ MODAL ABERTO MAS SEM USUÁRIO')
    }
  }, [user, isOpen, onClose])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const validateLoginForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!loginForm.email) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(loginForm.email)) {
      errors.email = 'Email inválido'
    }
    
    if (!loginForm.password) {
      errors.password = 'Senha é obrigatória'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateSignUpForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!signUpForm.nomeCompleto) {
      errors.nomeCompleto = 'Nome completo é obrigatório'
    } else if (signUpForm.nomeCompleto.trim().length < 2) {
      errors.nomeCompleto = 'Nome deve ter pelo menos 2 caracteres'
    }
    
    if (!signUpForm.email) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(signUpForm.email)) {
      errors.email = 'Email inválido'
    }
    
    if (!signUpForm.password) {
      errors.password = 'Senha é obrigatória'
    } else if (!validatePassword(signUpForm.password)) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres'
    }
    
    if (!signUpForm.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória'
    } else if (signUpForm.password !== signUpForm.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateResetForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!resetForm.email) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(resetForm.email)) {
      errors.email = 'Email inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔥 FORM SUBMIT - Iniciando processo de login')
    console.log('- Email:', loginForm.email)
    console.log('- Password length:', loginForm.password.length)
    console.log('- Loading state:', loading)
    
    if (!validateLoginForm()) {
      console.log('❌ FORM SUBMIT - Validação falhou')
      return
    }
    
    if (loading) {
      console.log('❌ FORM SUBMIT - Já está carregando, ignorando')
      return
    }
    
    console.log('🔥 FORM SUBMIT - Chamando signIn...')
    await signIn(loginForm.email, loginForm.password)
    console.log('🔥 FORM SUBMIT - signIn completado')
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSignUpForm() || loading) return
    
    await signUp(signUpForm.email, signUpForm.password, signUpForm.nomeCompleto)
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateResetForm() || loading) return
    
    await resetPassword(resetForm.email)
  }

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar na sua conta'
      case 'signup': return 'Criar nova conta'
      case 'reset': return 'Recuperar senha'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Acesse seus dados financeiros'
      case 'signup': return 'Comece a organizar suas finanças'
      case 'reset': return 'Enviamos um link por email'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md mx-auto relative animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-3">
            {mode !== 'login' && (
              <button
                onClick={() => setMode('login')}
                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                disabled={loading}
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-white">
              {getTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-6">{getSubtitle()}</p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-4 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.email ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-12 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.password ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </button>
              </div>

              <div className="text-center pt-4 border-t border-slate-600">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    disabled={loading}
                  >
                    Esqueci minha senha
                  </button>
                  <p className="text-slate-400 text-sm">
                    Não tem conta?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                      disabled={loading}
                    >
                      Criar conta
                    </button>
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signUpForm.nomeCompleto}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                    className={`w-full bg-slate-700 border px-4 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.nomeCompleto ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Seu nome completo"
                    disabled={loading}
                  />
                </div>
                {formErrors.nomeCompleto && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.nomeCompleto}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-4 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.email ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-12 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.password ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-12 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.confirmPassword ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Repita sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar Conta
                </button>
              </div>

              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-xs text-slate-400 mb-3">
                  Ao criar uma conta, você concorda com nossos termos de uso
                </p>
                <p className="text-slate-400 text-sm">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    disabled={loading}
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => setResetForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full bg-slate-700 border pl-10 pr-4 py-3 text-white rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors ${
                      formErrors.email ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar Link de Recuperação
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}