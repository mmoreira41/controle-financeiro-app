import { supabase } from '../lib/supabase'

// 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO PARA CATEGORIAS
export const runCategoryDiagnostics = async () => {
  console.log('🔍 =========================')
  console.log('🔍 DIAGNÓSTICO DE CATEGORIAS')
  console.log('🔍 =========================')

  try {
    // 1. VERIFICAR USUÁRIO ATUAL
    console.log('\n📋 1. VERIFICANDO USUÁRIO ATUAL:')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message)
    } else if (user) {
      console.log('✅ Usuário logado:', user.email)
      console.log('✅ User ID:', user.id)
    } else {
      console.log('⚠️ Nenhum usuário logado')
    }

    // 2. TESTAR ACESSO À TABELA CATEGORIAS
    console.log('\n📋 2. TESTANDO ACESSO À TABELA:')
    const { data: testAccess, error: accessError } = await supabase
      .from('categoria')
      .select('count(*)')
      .limit(1)

    if (accessError) {
      console.error('❌ Erro de acesso à tabela categoria:', accessError.message)
      console.error('❌ Detalhes:', accessError)
      return
    } else {
      console.log('✅ Acesso à tabela categoria funcionando')
    }

    // 3. CONTAR TOTAL DE CATEGORIAS
    console.log('\n📋 3. CONTANDO CATEGORIAS TOTAIS:')
    const { count: totalCategorias, error: countError } = await supabase
      .from('categoria')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Erro ao contar categorias:', countError.message)
    } else {
      console.log(`📊 Total de categorias na tabela: ${totalCategorias}`)
    }

    // 4. BUSCAR CATEGORIAS GLOBAIS (user_id = NULL)
    console.log('\n📋 4. VERIFICANDO CATEGORIAS GLOBAIS:')
    const { data: globais, error: globaisError } = await supabase
      .from('categoria')
      .select('id, nome, tipo, sistema, user_id')
      .is('user_id', null)

    if (globaisError) {
      console.error('❌ Erro ao buscar categorias globais:', globaisError.message)
    } else {
      console.log(`📊 Categorias globais encontradas: ${globais?.length || 0}`)
      if (globais && globais.length > 0) {
        console.log('📝 Primeiras 5 categorias globais:')
        globais.slice(0, 5).forEach(cat => {
          console.log(`   - ${cat.nome} (${cat.tipo})`)
        })
      }
    }

    // 5. BUSCAR CATEGORIAS DO USUÁRIO (se logado)
    if (user) {
      console.log('\n📋 5. VERIFICANDO CATEGORIAS DO USUÁRIO:')
      const { data: userCats, error: userCatsError } = await supabase
        .from('categoria')
        .select('id, nome, tipo, sistema, user_id')
        .eq('user_id', user.id)

      if (userCatsError) {
        console.error('❌ Erro ao buscar categorias do usuário:', userCatsError.message)
      } else {
        console.log(`📊 Categorias do usuário: ${userCats?.length || 0}`)
        if (userCats && userCats.length > 0) {
          userCats.forEach(cat => {
            console.log(`   - ${cat.nome} (${cat.tipo})`)
          })
        }
      }
    }

    // 6. TESTAR QUERY COMBINADA (globais + usuário)
    console.log('\n📋 6. TESTANDO QUERY COMBINADA:')
    let combinedQuery = supabase
      .from('categoria')
      .select('id, nome, tipo, sistema, user_id')

    if (user) {
      // Query que o sistema usa: globais + do usuário
      combinedQuery = combinedQuery.or(`user_id.is.null,user_id.eq.${user.id}`)
    } else {
      // Apenas globais se não logado
      combinedQuery = combinedQuery.is('user_id', null)
    }

    const { data: combined, error: combinedError } = await combinedQuery
      .order('sistema', { ascending: false })
      .order('nome', { ascending: true })

    if (combinedError) {
      console.error('❌ Erro na query combinada:', combinedError.message)
      console.error('❌ Detalhes:', combinedError)
    } else {
      console.log(`📊 Query combinada retornou: ${combined?.length || 0} categorias`)
      
      if (combined && combined.length > 0) {
        console.log('📝 Todas as categorias encontradas:')
        
        const byType = combined.reduce((acc, cat) => {
          acc[cat.tipo] = (acc[cat.tipo] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        Object.entries(byType).forEach(([tipo, count]) => {
          console.log(`   ${tipo}: ${count} categorias`)
        })
        
        console.log('📝 Primeiras 10 categorias:')
        combined.slice(0, 10).forEach(cat => {
          const global = cat.user_id === null ? '🌍' : '👤'
          console.log(`   ${global} ${cat.nome} (${cat.tipo})`)
        })
      }
    }

    // 7. TESTAR INSERÇÃO DE CATEGORIA TESTE
    console.log('\n📋 7. TESTANDO INSERÇÃO DE CATEGORIA TESTE:')
    const testCategoryName = `Teste Diagnóstico ${Date.now()}`
    
    const { data: insertedTest, error: insertError } = await supabase
      .from('categoria')
      .insert([{
        nome: testCategoryName,
        tipo: 'Entrada',
        sistema: false,
        user_id: null, // Global
        orcamento_mensal: null
      }])
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir categoria teste:', insertError.message)
      console.error('❌ Isso pode indicar problema de RLS ou permissões')
    } else {
      console.log('✅ Categoria teste inserida com sucesso:', insertedTest)
      
      // Limpar categoria teste
      await supabase
        .from('categoria')
        .delete()
        .eq('nome', testCategoryName)
      console.log('🧹 Categoria teste removida')
    }

    // 8. RESUMO E RECOMENDAÇÕES
    console.log('\n📋 8. RESUMO E DIAGNÓSTICO:')
    console.log('================================')
    
    if (!globais || globais.length === 0) {
      console.log('🚨 PROBLEMA PRINCIPAL: Não há categorias globais no banco!')
      console.log('📋 SOLUÇÃO: Executar inserção das 33 categorias globais')
      console.log('💡 Execute: insertGlobalCategories() no console')
    } else if (globais.length < 33) {
      console.log(`⚠️ PROBLEMA: Apenas ${globais.length}/33 categorias globais existem`)
      console.log('📋 SOLUÇÃO: Completar inserção das categorias faltantes')
    } else {
      console.log('✅ Categorias globais existem no banco')
      
      if (!combined || combined.length === 0) {
        console.log('🚨 PROBLEMA: Query combinada não retorna categorias')
        console.log('📋 POSSÍVEL CAUSA: Problema de RLS ou query incorreta')
      } else {
        console.log('✅ Sistema de categorias funcionando corretamente!')
      }
    }

  } catch (error) {
    console.error('💥 ERRO FATAL no diagnóstico:', error)
  }
}

// Disponibilizar globalmente para execução manual
if (typeof window !== 'undefined') {
  (window as any).runCategoryDiagnostics = runCategoryDiagnostics
  console.log('🔧 Execute no console: runCategoryDiagnostics()')
}