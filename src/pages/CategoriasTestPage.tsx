import React from 'react'
import { useCategorias } from '../hooks/useCategorias'
import { CategoriaItem } from '../components/CategoriaItem'
import { inserirCategoriasGlobais, verificarCategoriasGlobais } from '../lib/supabase'

const CategoriasTestPage: React.FC = () => {
  const { categorias, loading, error, addCategoria } = useCategorias()

  const handleInserirGlobais = async () => {
    console.log('🔄 Inserindo categorias globais manualmente...')
    const success = await inserirCategoriasGlobais()
    if (success) {
      console.log('✅ Categorias globais inseridas!')
      // Forçar reload da página para ver as mudanças
      window.location.reload()
    } else {
      console.error('❌ Falha ao inserir categorias globais')
    }
  }

  const handleVerificarGlobais = async () => {
    await verificarCategoriasGlobais()
  }

  const handleCriarCategoriaPersonalizada = async () => {
    const nome = prompt('Nome da categoria personalizada:')
    if (nome) {
      const resultado = await addCategoria({
        nome,
        tipo: 'Saida', // Por exemplo
        sistema: false,
        orcamento_mensal: null
      })
      
      if (resultado) {
        console.log('✅ Categoria personalizada criada:', resultado)
      } else {
        console.error('❌ Falha ao criar categoria personalizada')
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Teste de Categorias</h1>
        <p>Carregando categorias...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Teste de Categorias</h1>
        <p className="text-red-600">Erro: {error}</p>
      </div>
    )
  }

  const globais = categorias.filter(c => c.user_id === null)
  const personalizadas = categorias.filter(c => c.user_id !== null)
  const sistema = categorias.filter(c => c.sistema)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">🧪 Teste de Categorias</h1>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Total</h3>
          <p className="text-2xl font-bold text-blue-600">{categorias.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Globais</h3>
          <p className="text-2xl font-bold text-green-600">{globais.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Personalizadas</h3>
          <p className="text-2xl font-bold text-purple-600">{personalizadas.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Sistema</h3>
          <p className="text-2xl font-bold text-gray-600">{sistema.length}</p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleInserirGlobais}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🌐 Inserir Categorias Globais
        </button>
        <button 
          onClick={handleVerificarGlobais}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          🔍 Verificar no Console
        </button>
        <button 
          onClick={handleCriarCategoriaPersonalizada}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          ➕ Criar Categoria Personalizada
        </button>
      </div>

      {/* Lista de Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias Globais */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-green-700">
            🌐 Categorias Globais ({globais.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {globais.map(categoria => (
              <div key={categoria.id} className="p-2 border rounded">
                <CategoriaItem categoria={categoria} />
                <small className="text-gray-500">{categoria.tipo}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Categorias Personalizadas */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            👤 Categorias Personalizadas ({personalizadas.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {personalizadas.length > 0 ? (
              personalizadas.map(categoria => (
                <div key={categoria.id} className="p-2 border rounded">
                  <CategoriaItem categoria={categoria} />
                  <small className="text-gray-500">{categoria.tipo}</small>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">Nenhuma categoria personalizada criada</p>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">🔧 Debug Info</h3>
        <p>Total de categorias carregadas: {categorias.length}</p>
        <p>Loading: {loading ? 'Sim' : 'Não'}</p>
        <p>Erro: {error || 'Nenhum'}</p>
        <details className="mt-2">
          <summary className="cursor-pointer">Ver JSON completo</summary>
          <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(categorias, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

export default CategoriasTestPage