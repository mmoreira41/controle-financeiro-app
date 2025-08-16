import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContextType, AuthState } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const clearError = () => {
    setError(null)
  }

  const handleAuthError = (error: AuthError | Error) => {
    console.error('Auth error:', error)
    
    // Mapear erros para mensagens amigáveis
    let message = 'Ocorreu um erro inesperado'
    
    if (error.message.includes('Invalid login credentials')) {
      message = 'Email ou senha incorretos'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Para acessar, confirme seu email clicando no link enviado para sua caixa de entrada'
    } else if (error.message.includes('User already registered')) {
      message = 'Este email já está cadastrado'
    } else if (error.message.includes('Password should be at least')) {
      message = 'A senha deve ter pelo menos 6 caracteres'
    } else if (error.message.includes('Unable to validate email address')) {
      message = 'Email inválido'
    } else if (error.message.includes('Network error')) {
      message = 'Erro de conexão. Verifique sua internet'
    }
    
    setError(message)
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔥 INÍCIO DO LOGIN')
      console.log('Email:', email.trim())
      console.log('Password length:', password.length)
      console.log('Supabase client exists:', !!supabase)
      
      setLoading(true)
      clearError()
      
      console.log('🔥 CHAMANDO signInWithPassword...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      console.log('🔥 RESPOSTA COMPLETA DO LOGIN:')
      console.log('- Data completa:', data)
      console.log('- Error:', error)
      console.log('- Session exists:', !!data?.session)
      console.log('- User exists:', !!data?.user)
      console.log('- User ID:', data?.user?.id)
      console.log('- User email:', data?.user?.email)

      if (error) {
        console.error('❌ ERRO ENCONTRADO:', error.message)
        console.error('❌ ERRO COMPLETO:', error)
        handleAuthError(error)
        return
      }

      if (data.user && data.session) {
        console.log('✅ LOGIN SUCESSO!')
        console.log('✅ Session access_token:', data.session.access_token.substring(0, 20) + '...')
        console.log('✅ User ID:', data.user.id)
        console.log('✅ User email:', data.user.email)
        
        console.log('🔥 ATUALIZANDO ESTADO GLOBAL...')
        setState(prev => ({
          ...prev,
          user: data.user,
          session: data.session,
          loading: false,
          error: null
        }))
        console.log('✅ ESTADO ATUALIZADO COM SUCESSO!')
        
      } else {
        console.error('❌ LOGIN FALHOU - Sem session ou user')
        console.error('- data.user:', data.user)
        console.error('- data.session:', data.session)
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO LOGIN:', error)
      handleAuthError(error as Error)
    } finally {
      console.log('🔥 FINALIZANDO LOGIN - setLoading(false)')
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, nomeCompleto?: string) => {
    try {
      setLoading(true)
      clearError()
      
      console.log('=== SIGNUP ATTEMPT ===')
      console.log('Email:', email.trim())
      console.log('Password length:', password.length)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome_completo: nomeCompleto || ''
          }
        }
      })

      console.log('=== SIGNUP RESULT ===')
      console.log('Data:', data)
      console.log('Error:', error)
      console.log('User:', data?.user)
      console.log('Session:', data?.session)

      if (error) {
        console.error('❌ SIGNUP ERROR:', error.message)
        handleAuthError(error)
        return
      }

      if (data.user) {
        console.log('✅ SIGNUP SUCCESS - User created')
        
        // Se o usuário foi criado mas ainda não confirmou o email
        if (!data.session) {
          console.log('📧 Email confirmation required')
          setError('Conta criada com sucesso! Verifique seu email e clique no link de confirmação para acessar a plataforma.')
        } else {
          console.log('✅ SIGNUP COMPLETE - User logged in automatically')
          setState(prev => ({
            ...prev,
            user: data.user,
            session: data.session,
            loading: false,
            error: null
          }))
        }
      } else {
        console.warn('⚠️ SIGNUP INCOMPLETE - No user returned')
      }
    } catch (error) {
      console.error('💥 SIGNUP EXCEPTION:', error)
      handleAuthError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('🔥 INICIANDO LOGOUT...')
      setLoading(true)
      clearError()
      
      // Logout do Supabase
      console.log('🔥 Fazendo logout no Supabase...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ ERRO AO FAZER LOGOUT:', error)
        handleAuthError(error)
        return
      }

      console.log('✅ LOGOUT DO SUPABASE CONCLUÍDO')
      
      // Limpar storage local
      console.log('🔥 Limpando dados locais...')
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-ucnptgyxzisaoutdajqf-auth-token')
        sessionStorage.clear()
        console.log('✅ DADOS LOCAIS LIMPOS')
      } catch (storageError) {
        console.warn('⚠️ Erro ao limpar storage:', storageError)
      }

      // Atualizar estado
      console.log('🔥 Atualizando estado para null...')
      setState({
        user: null,
        session: null,
        loading: false,
        error: null
      })
      
      console.log('✅ LOGOUT COMPLETO!')
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO LOGOUT:', error)
      handleAuthError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      clearError()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        handleAuthError(error)
        return
      }

      setError('Email de recuperação enviado! Verifique sua caixa de entrada.')
    } catch (error) {
      handleAuthError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  const resendConfirmation = async (email: string) => {
    try {
      setLoading(true)
      clearError()
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      })

      if (error) {
        handleAuthError(error)
        return
      }

      setError('Email de confirmação reenviado! Verifique sua caixa de entrada.')
    } catch (error) {
      handleAuthError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    let mounted = true

    // Verificar sessão inicial
    console.log('🔥 VERIFICANDO SESSÃO INICIAL...')
    
    const getInitialSession = async () => {
      try {
        console.log('🔥 Chamando supabase.auth.getSession()...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔥 SESSÃO INICIAL OBTIDA:')
        console.log('- Session exists:', !!session)
        console.log('- Error:', error)
        console.log('- User exists:', !!session?.user)
        console.log('- User email:', session?.user?.email)
        
        if (mounted) {
          if (error) {
            console.error('❌ ERRO AO OBTER SESSÃO INICIAL:', error)
            setState(prev => ({ ...prev, loading: false, error: error.message }))
          } else {
            console.log('🔥 DEFININDO ESTADO INICIAL...')
            setState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session: session,
              loading: false
            }))
            
            if (session?.user) {
              console.log('✅ USUÁRIO JÁ LOGADO ENCONTRADO:', session.user.email)
            } else {
              console.log('❌ NENHUMA SESSÃO ATIVA')
            }
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('💥 ERRO CRÍTICO AO OBTER SESSÃO:', error)
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    getInitialSession()

    // Escutar mudanças de autenticação
    console.log('🔥 CONFIGURANDO onAuthStateChange...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) {
          console.log('🔥 AUTH CHANGE IGNORADO - componente desmontado')
          return
        }

        console.log('🔥 AUTH STATE MUDOU!')
        console.log('- Event:', event)
        console.log('- Session exists:', !!session)
        console.log('- User exists:', !!session?.user)
        console.log('- User email:', session?.user?.email)
        console.log('- User ID:', session?.user?.id)

        console.log('🔥 ATUALIZANDO ESTADO VIA onAuthStateChange...')
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session: session,
          loading: false,
          error: null
        }))
        console.log('✅ ESTADO ATUALIZADO VIA onAuthStateChange!')

        // Casos especiais
        if (event === 'SIGNED_IN') {
          console.log('✅ USUÁRIO LOGADO DETECTADO VIA onAuthStateChange!')
          console.log('✅ User data:', session?.user)
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('❌ USUÁRIO DESLOGADO VIA onAuthStateChange')
          // Limpar dados locais se necessário
          localStorage.removeItem('supabase.auth.token')
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 TOKEN REFRESHED VIA onAuthStateChange')
        }
      }
    )
    
    console.log('🔥 onAuthStateChange configurado com sucesso')

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}