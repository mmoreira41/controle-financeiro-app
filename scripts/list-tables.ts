import { supabase } from '../lib/supabase.js'

async function listTables() {
  try {
    // Lista todas as tabelas do schema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'spatial_ref_sys') // Remove tabela do PostGIS se existir

    if (error) {
      console.error('Erro ao listar tabelas:', error)
      return
    }

    console.log('=== TABELAS NO SUPABASE ===')
    if (data && data.length > 0) {
      data.forEach((table: any) => {
        console.log(`- ${table.table_name}`)
      })
    } else {
      console.log('Nenhuma tabela encontrada.')
    }

    // Também vamos tentar listar as tabelas usando uma abordagem alternativa
    console.log('\n=== VERIFICANDO ESTRUTURA ===')
    
    // Tenta acessar as tabelas baseadas nos tipos do projeto
    const tables = [
      'contas_bancarias',
      'cartoes',
      'categorias', 
      'transacoes_banco',
      'compras_cartao',
      'parcelas_cartao'
    ]

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: OK`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Erro de conexão`)
      }
    }

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

listTables()