-- ######################################################
-- SISTEMA DE CONTROLE FINANCEIRO - SCHEMA COMPLETO
-- Execute este script no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/ucnptgyxzisaoutdajqf/sql
-- ######################################################

-- =====================================================
-- STEP 1: EXTENSÕES E CONFIGURAÇÕES
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- =====================================================
-- STEP 2: TIPOS ENUM
-- =====================================================

-- Tipos de transação
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_transacao') THEN
        CREATE TYPE tipo_transacao AS ENUM (
            'Entrada',
            'Saida', 
            'Investimento',
            'Transferencia',
            'Estorno'
        );
    END IF;
END $$;

-- Status de lançamento
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lancamento') THEN
        CREATE TYPE status_lancamento AS ENUM (
            'Previsto',
            'Realizado',
            'Cancelado'
        );
    END IF;
END $$;

-- Bandeiras de cartão
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bandeira_cartao') THEN
        CREATE TYPE bandeira_cartao AS ENUM (
            'Visa',
            'Mastercard',
            'American Express',
            'Elo',
            'Hipercard',
            'Dinners',
            'Outro'
        );
    END IF;
END $$;

-- =====================================================
-- STEP 3: TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: CONTAS BANCÁRIAS
CREATE TABLE IF NOT EXISTS conta_bancaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    saldo_inicial NUMERIC(14,2) DEFAULT 0 CHECK (saldo_inicial >= 0),
    data_inicial DATE NOT NULL DEFAULT CURRENT_DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT conta_nome_unico_por_usuario UNIQUE(user_id, nome)
);

-- Tabela: CARTÕES DE CRÉDITO
CREATE TABLE IF NOT EXISTS cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    apelido TEXT NOT NULL,
    dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 28),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    limite NUMERIC(14,2) CHECK (limite IS NULL OR limite >= 0),
    bandeira bandeira_cartao DEFAULT 'Visa',
    cor TEXT DEFAULT '#6b7280',
    conta_id_padrao UUID REFERENCES conta_bancaria(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT cartao_apelido_unico_por_usuario UNIQUE(user_id, apelido)
);

-- Tabela: CATEGORIAS
CREATE TABLE IF NOT EXISTS categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo tipo_transacao NOT NULL,
    sistema BOOLEAN DEFAULT false,
    orcamento_mensal NUMERIC(14,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT categoria_nome_unico_por_usuario UNIQUE(user_id, nome)
);

-- Tabela: PARÂMETROS DO USUÁRIO
CREATE TABLE IF NOT EXISTS parametro_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fuso TEXT DEFAULT 'America/Sao_Paulo',
    moeda TEXT DEFAULT 'BRL',
    incluir_previstos_no_resumo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT usuario_unico UNIQUE(user_id)
);

-- Tabela: TRANSAÇÕES BANCÁRIAS
CREATE TABLE IF NOT EXISTS transacao_banco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES conta_bancaria(id) ON DELETE RESTRICT,
    data DATE NOT NULL,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    tipo tipo_transacao NOT NULL,
    descricao TEXT,
    transferencia_par_id UUID REFERENCES transacao_banco(id) ON DELETE CASCADE,
    previsto BOOLEAN DEFAULT false,
    realizado BOOLEAN DEFAULT true,
    recorrencia TEXT,
    
    -- Campos meta para controles especiais
    meta_saldo_inicial BOOLEAN DEFAULT false,
    meta_pagamento BOOLEAN DEFAULT false,
    cartao_id UUID REFERENCES cartao(id) ON DELETE SET NULL,
    competencia_fatura DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT descricao_max_length CHECK (LENGTH(descricao) <= 200),
    CONSTRAINT previsto_realizado_check CHECK (previsto = false OR realizado = false)
);

-- Tabela: COMPRAS NO CARTÃO
CREATE TABLE IF NOT EXISTS compra_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cartao_id UUID NOT NULL REFERENCES cartao(id) ON DELETE RESTRICT,
    data_compra DATE NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total > 0),
    parcelas_total INTEGER NOT NULL CHECK (parcelas_total >= 1),
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    descricao TEXT,
    estorno BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT descricao_max_length CHECK (LENGTH(descricao) <= 200)
);

-- Tabela: PARCELAS DO CARTÃO
CREATE TABLE IF NOT EXISTS parcela_cartao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    compra_id UUID NOT NULL REFERENCES compra_cartao(id) ON DELETE CASCADE,
    n_parcela INTEGER NOT NULL CHECK (n_parcela >= 1),
    valor_parcela NUMERIC(14,2) NOT NULL CHECK (valor_parcela > 0),
    competencia_fatura DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT parcela_unica_por_compra UNIQUE(compra_id, n_parcela)
);

-- Tabela: LANÇAMENTOS FUTUROS
CREATE TABLE IF NOT EXISTS lancamento_futuro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    tipo tipo_transacao NOT NULL,
    descricao TEXT,
    rrule TEXT,
    status status_lancamento DEFAULT 'Previsto',
    conta_id UUID REFERENCES conta_bancaria(id) ON DELETE SET NULL,
    cartao_id UUID REFERENCES cartao(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT descricao_max_length CHECK (LENGTH(descricao) <= 200),
    CONSTRAINT conta_ou_cartao CHECK (
        (conta_id IS NOT NULL AND cartao_id IS NULL) OR 
        (conta_id IS NULL AND cartao_id IS NOT NULL) OR
        (conta_id IS NULL AND cartao_id IS NULL)
    )
);

-- =====================================================
-- STEP 4: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para conta_bancaria
CREATE INDEX IF NOT EXISTS idx_conta_bancaria_user_id ON conta_bancaria(user_id);
CREATE INDEX IF NOT EXISTS idx_conta_bancaria_ativo ON conta_bancaria(ativo) WHERE ativo = true;

-- Índices para cartao
CREATE INDEX IF NOT EXISTS idx_cartao_user_id ON cartao(user_id);

-- Índices para categoria
CREATE INDEX IF NOT EXISTS idx_categoria_user_id ON categoria(user_id);
CREATE INDEX IF NOT EXISTS idx_categoria_tipo ON categoria(tipo);
CREATE INDEX IF NOT EXISTS idx_categoria_sistema ON categoria(sistema) WHERE sistema = true;

-- Índices para parametro_usuario
CREATE INDEX IF NOT EXISTS idx_parametro_usuario_user_id ON parametro_usuario(user_id);

-- Índices para transacao_banco
CREATE INDEX IF NOT EXISTS idx_transacao_banco_user_id ON transacao_banco(user_id);
CREATE INDEX IF NOT EXISTS idx_transacao_banco_conta_id ON transacao_banco(conta_id);
CREATE INDEX IF NOT EXISTS idx_transacao_banco_data ON transacao_banco(data);
CREATE INDEX IF NOT EXISTS idx_transacao_banco_categoria_id ON transacao_banco(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacao_banco_user_conta_data ON transacao_banco(user_id, conta_id, data DESC);

-- Índices para compra_cartao
CREATE INDEX IF NOT EXISTS idx_compra_cartao_user_id ON compra_cartao(user_id);
CREATE INDEX IF NOT EXISTS idx_compra_cartao_cartao_id ON compra_cartao(cartao_id);
CREATE INDEX IF NOT EXISTS idx_compra_cartao_user_cartao_data ON compra_cartao(user_id, cartao_id, data_compra DESC);

-- Índices para parcela_cartao
CREATE INDEX IF NOT EXISTS idx_parcela_cartao_user_id ON parcela_cartao(user_id);
CREATE INDEX IF NOT EXISTS idx_parcela_cartao_compra_id ON parcela_cartao(compra_id);
CREATE INDEX IF NOT EXISTS idx_parcela_cartao_user_competencia ON parcela_cartao(user_id, competencia_fatura);

-- Índices para lancamento_futuro
CREATE INDEX IF NOT EXISTS idx_lancamento_futuro_user_id ON lancamento_futuro(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_futuro_data ON lancamento_futuro(data);

-- =====================================================
-- STEP 5: FUNCTIONS UTILITÁRIAS
-- =====================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para gerar parcelas do cartão
CREATE OR REPLACE FUNCTION gerar_parcelas_cartao()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_parcela NUMERIC(14,2);
    v_valor_restante NUMERIC(14,2);
    v_competencia DATE;
    v_dia_fechamento INTEGER;
    v_i INTEGER;
BEGIN
    -- Buscar dia de fechamento do cartão
    SELECT dia_fechamento INTO v_dia_fechamento
    FROM cartao
    WHERE id = NEW.cartao_id;
    
    -- Calcular valor base da parcela
    v_valor_parcela := ROUND(NEW.valor_total / NEW.parcelas_total, 2);
    v_valor_restante := NEW.valor_total;
    
    -- Gerar parcelas
    FOR v_i IN 1..NEW.parcelas_total LOOP
        -- Calcular competência da parcela
        v_competencia := NEW.data_compra;
        
        -- Adicionar meses conforme número da parcela
        v_competencia := v_competencia + INTERVAL '1 month' * (v_i - 1);
        
        -- Ajustar para o mês da fatura baseado no dia de fechamento
        IF EXTRACT(DAY FROM NEW.data_compra) > v_dia_fechamento THEN
            v_competencia := v_competencia + INTERVAL '1 month';
        END IF;
        
        -- Definir primeiro dia do mês da competência
        v_competencia := DATE_TRUNC('month', v_competencia);
        
        -- Última parcela pega o restante (ajuste de centavos)
        IF v_i = NEW.parcelas_total THEN
            v_valor_parcela := v_valor_restante;
        END IF;
        
        -- Inserir parcela
        INSERT INTO parcela_cartao (
            user_id,
            compra_id,
            n_parcela,
            valor_parcela,
            competencia_fatura
        ) VALUES (
            NEW.user_id,
            NEW.id,
            v_i,
            v_valor_parcela,
            v_competencia
        );
        
        v_valor_restante := v_valor_restante - v_valor_parcela;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para validar tipo da categoria
CREATE OR REPLACE FUNCTION validar_tipo_categoria()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo tipo_transacao;
BEGIN
    -- Buscar tipo da categoria
    SELECT tipo INTO v_tipo
    FROM categoria
    WHERE id = NEW.categoria_id;
    
    -- Atualizar o tipo na transação
    NEW.tipo := v_tipo;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para criar categorias padrão
CREATE OR REPLACE FUNCTION criar_categorias_padrao()
RETURNS TRIGGER AS $$
BEGIN
    -- Categorias de Entrada
    INSERT INTO categoria (user_id, nome, tipo, sistema) VALUES
    (NEW.id, 'Salário', 'Entrada', false),
    (NEW.id, 'Outras Entradas', 'Entrada', false);
    
    -- Categorias de Saída
    INSERT INTO categoria (user_id, nome, tipo, sistema) VALUES
    (NEW.id, 'Alimentação', 'Saida', false),
    (NEW.id, 'Transporte', 'Saida', false),
    (NEW.id, 'Moradia', 'Saida', false),
    (NEW.id, 'Outras Despesas', 'Saida', false);
    
    -- Categorias de Sistema
    INSERT INTO categoria (user_id, nome, tipo, sistema) VALUES
    (NEW.id, 'Transferência', 'Transferencia', true),
    (NEW.id, 'Saldo Inicial', 'Transferencia', true),
    (NEW.id, 'Pagamento de Cartão', 'Transferencia', true);
    
    -- Criar parâmetros padrão do usuário
    INSERT INTO parametro_usuario (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para obter dados do usuário (formato compatível com frontend)
CREATE OR REPLACE FUNCTION obter_dados_usuario(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'contas', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'nome', nome,
                'saldo_inicial', saldo_inicial,
                'data_inicial', data_inicial,
                'ativo', ativo,
                'createdAt', created_at,
                'updatedAt', updated_at
            )), '[]'::json)
            FROM conta_bancaria 
            WHERE user_id = p_user_id
        ),
        'cartoes', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'apelido', apelido,
                'dia_fechamento', dia_fechamento,
                'dia_vencimento', dia_vencimento,
                'limite', limite,
                'bandeira', bandeira,
                'cor', cor,
                'conta_id_padrao', conta_id_padrao,
                'createdAt', created_at,
                'updatedAt', updated_at
            )), '[]'::json)
            FROM cartao 
            WHERE user_id = p_user_id
        ),
        'categorias', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'nome', nome,
                'tipo', tipo,
                'sistema', sistema,
                'orcamento_mensal', orcamento_mensal,
                'createdAt', created_at,
                'updatedAt', updated_at
            )), '[]'::json)
            FROM categoria 
            WHERE user_id = p_user_id
        ),
        'transacoes', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'conta_id', conta_id,
                'data', data,
                'valor', valor,
                'categoria_id', categoria_id,
                'tipo', tipo,
                'descricao', descricao,
                'transferencia_par_id', transferencia_par_id,
                'previsto', previsto,
                'realizado', realizado,
                'recorrencia', recorrencia,
                'createdAt', created_at,
                'updatedAt', updated_at
            )), '[]'::json)
            FROM transacao_banco 
            WHERE user_id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: TRIGGERS
-- =====================================================

-- Triggers para updated_at
CREATE TRIGGER update_conta_bancaria_updated_at 
    BEFORE UPDATE ON conta_bancaria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cartao_updated_at 
    BEFORE UPDATE ON cartao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categoria_updated_at 
    BEFORE UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacao_banco_updated_at 
    BEFORE UPDATE ON transacao_banco
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compra_cartao_updated_at 
    BEFORE UPDATE ON compra_cartao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parcela_cartao_updated_at 
    BEFORE UPDATE ON parcela_cartao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lancamento_futuro_updated_at 
    BEFORE UPDATE ON lancamento_futuro
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parametro_usuario_updated_at 
    BEFORE UPDATE ON parametro_usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar parcelas automaticamente
CREATE TRIGGER trigger_gerar_parcelas
    AFTER INSERT ON compra_cartao
    FOR EACH ROW
    EXECUTE FUNCTION gerar_parcelas_cartao();

-- Triggers para validar tipo da categoria
CREATE TRIGGER trigger_validar_tipo_transacao
    BEFORE INSERT OR UPDATE ON transacao_banco
    FOR EACH ROW
    EXECUTE FUNCTION validar_tipo_categoria();

CREATE TRIGGER trigger_validar_tipo_lancamento
    BEFORE INSERT OR UPDATE ON lancamento_futuro
    FOR EACH ROW
    EXECUTE FUNCTION validar_tipo_categoria();

-- Trigger para criar categorias padrão para novos usuários
CREATE TRIGGER trigger_criar_categorias_padrao
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION criar_categorias_padrao();

-- =====================================================
-- STEP 7: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE conta_bancaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacao_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcela_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamento_futuro ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametro_usuario ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: POLÍTICAS RLS
-- =====================================================

-- Políticas para conta_bancaria
CREATE POLICY "conta_bancaria_select_policy" ON conta_bancaria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conta_bancaria_insert_policy" ON conta_bancaria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conta_bancaria_update_policy" ON conta_bancaria FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conta_bancaria_delete_policy" ON conta_bancaria FOR DELETE USING (auth.uid() = user_id);

-- Políticas para cartao
CREATE POLICY "cartao_select_policy" ON cartao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cartao_insert_policy" ON cartao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cartao_update_policy" ON cartao FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cartao_delete_policy" ON cartao FOR DELETE USING (auth.uid() = user_id);

-- Políticas para categoria
CREATE POLICY "categoria_select_policy" ON categoria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categoria_insert_policy" ON categoria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categoria_update_policy" ON categoria FOR UPDATE USING (auth.uid() = user_id AND sistema = false) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categoria_delete_policy" ON categoria FOR DELETE USING (auth.uid() = user_id AND sistema = false);

-- Políticas para transacao_banco
CREATE POLICY "transacao_banco_select_policy" ON transacao_banco FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transacao_banco_insert_policy" ON transacao_banco FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacao_banco_update_policy" ON transacao_banco FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacao_banco_delete_policy" ON transacao_banco FOR DELETE USING (auth.uid() = user_id);

-- Políticas para compra_cartao
CREATE POLICY "compra_cartao_select_policy" ON compra_cartao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "compra_cartao_insert_policy" ON compra_cartao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "compra_cartao_update_policy" ON compra_cartao FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "compra_cartao_delete_policy" ON compra_cartao FOR DELETE USING (auth.uid() = user_id);

-- Políticas para parcela_cartao
CREATE POLICY "parcela_cartao_select_policy" ON parcela_cartao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "parcela_cartao_insert_policy" ON parcela_cartao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parcela_cartao_update_policy" ON parcela_cartao FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parcela_cartao_delete_policy" ON parcela_cartao FOR DELETE USING (auth.uid() = user_id);

-- Políticas para lancamento_futuro
CREATE POLICY "lancamento_futuro_select_policy" ON lancamento_futuro FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lancamento_futuro_insert_policy" ON lancamento_futuro FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lancamento_futuro_update_policy" ON lancamento_futuro FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lancamento_futuro_delete_policy" ON lancamento_futuro FOR DELETE USING (auth.uid() = user_id);

-- Políticas para parametro_usuario
CREATE POLICY "parametro_usuario_select_policy" ON parametro_usuario FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "parametro_usuario_insert_policy" ON parametro_usuario FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parametro_usuario_update_policy" ON parametro_usuario FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parametro_usuario_delete_policy" ON parametro_usuario FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 9: PERMISSÕES
-- =====================================================

-- Dar permissões para usuários autenticados
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Dar permissões para o service_role (admin)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- STEP 10: VIEWS E VERIFICAÇÕES
-- =====================================================

-- View para verificação do schema
CREATE OR REPLACE VIEW verificacao_schema AS
SELECT 
    'Tabelas' as item,
    COUNT(*) as quantidade,
    'Esperado: 8' as esperado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'conta_bancaria', 'cartao', 'categoria', 'parametro_usuario',
    'transacao_banco', 'compra_cartao', 'parcela_cartao', 'lancamento_futuro'
  )
UNION ALL
SELECT 
    'Functions' as item,
    COUNT(*) as quantidade,
    'Esperado: 4+' as esperado
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('update_updated_at_column', 'gerar_parcelas_cartao', 'validar_tipo_categoria', 'criar_categorias_padrao')
UNION ALL
SELECT 
    'Triggers' as item,
    COUNT(*) as quantidade,
    'Esperado: 12+' as esperado
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
    'Políticas RLS' as item,
    COUNT(*) as quantidade,
    'Esperado: 32' as esperado
FROM pg_policies 
WHERE schemaname = 'public';

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Comentário final
COMMENT ON DATABASE postgres IS 'Sistema de controle financeiro - Schema completo instalado';

-- ######################################################
-- INSTALAÇÃO COMPLETA!
-- 
-- Para verificar se tudo está funcionando execute:
-- SELECT * FROM verificacao_schema;
-- 
-- Status esperado:
-- ✅ Tabelas: 8/8
-- ✅ Functions: 4+/4+  
-- ✅ Triggers: 12+/12+
-- ✅ Políticas RLS: 32/32
-- ######################################################