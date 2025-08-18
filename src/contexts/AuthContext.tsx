import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, cadastrarUsuario, fazerLogin, resetarSenha, inserirCategoriasGlobais } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, nome?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

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
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔧 AuthProvider: Inicializando...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Erro ao obter sessão inicial:', error.message)
      } else {
        console.log('✅ Sessão inicial obtida:', session ? 'Ativa' : 'Nenhuma')
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event)
      console.log('Nova sessão:', session ? 'Ativa' : 'Nenhuma')
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // 🔧 CORREÇÃO CRÍTICA: Garantir categorias globais quando usuário loga
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 Usuário logado, garantindo categorias globais...')
        console.log('🔧 ID do usuário:', session.user.id)
        
        try {
          const categoriasOK = await inserirCategoriasGlobais()
          if (categoriasOK) {
            console.log('✅ Categorias globais garantidas para o usuário')
          } else {
            console.error('❌ Falha ao garantir categorias globais')
          }
        } catch (error) {
          console.error('💥 Erro ao inserir categorias globais:', error)
        }
      }
    })

    return () => {
      console.log('🧹 AuthProvider: Limpando subscription')
      subscription.unsubscribe()
    }
  }, [])

  // 🔧 FUNÇÃO DE CADASTRO COM CORREÇÕES
  const signUp = async (email: string, password: string, nome?: string) => {
    try {
      console.log('📝 AuthContext: Iniciando cadastro')
      await cadastrarUsuario(email, password, nome)
      return { error: null }
    } catch (error: any) {
      console.error('❌ AuthContext: Erro no cadastro:', error.message)
      return { error: { message: error.message } as AuthError }
    }
  }

  // 🔧 FUNÇÃO DE LOGIN COM CORREÇÕES
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: Iniciando login')
      await fazerLogin(email, password)
      return { error: null }
    } catch (error: any) {
      console.error('❌ AuthContext: Erro no login:', error.message)
      return { error: { message: error.message } as AuthError }
    }
  }

  // 🔧 FUNÇÃO DE LOGOUT CORRIGIDA
  const signOut = async () => {
    try {
      console.log('🚪 AuthContext: Fazendo logout')
      
      // Limpar estados locais primeiro
      setUser(null)
      setSession(null)
      setLoading(true)
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Erro no logout:', error.message)
        throw error
      }
      
      console.log('✅ Logout realizado com sucesso')
      
      // Limpar localStorage se necessário
      localStorage.clear()
      
      // Forçar reload da página para garantir limpeza completa
      setTimeout(() => {
        window.location.reload()
      }, 100)
      
    } catch (error) {
      console.error('💥 Erro crítico no logout:', error)
      // Mesmo com erro, forçar limpeza local
      setUser(null)
      setSession(null)
      localStorage.clear()
      window.location.reload()
    }
  }

  // 🔧 FUNÇÃO DE RESET DE SENHA
  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 AuthContext: Reset de senha')
      await resetarSenha(email)
      return { error: null }
    } catch (error: any) {
      console.error('❌ AuthContext: Erro no reset:', error.message)
      return { error: { message: error.message } as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  // 🚨 DEBUG: Log do estado atual
  useEffect(() => {
    console.log('📊 AuthContext Estado:')
    console.log('- Loading:', loading)
    console.log('- User:', user ? `${user.email} (${user.id})` : 'Nenhum')
    console.log('- Session:', session ? 'Ativa' : 'Nenhuma')
  }, [user, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}