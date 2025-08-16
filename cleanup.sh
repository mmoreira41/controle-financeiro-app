#!/bin/bash

echo "🧹 Iniciando limpeza do projeto..."

# Deletar arquivos .md antigos (exceto README.md)
echo "�� Removendo documentação antiga..."
rm -f DATABASE_INTEGRATION_COMPLETE.md
rm -f EMERGENCY_SOLUTION.md
rm -f FINAL_STATUS_REPORT.md
rm -f AUTHENTICATION_FIX.md
rm -f AUTHENTICATION_SETUP.md

# Deletar scripts .js antigos
echo "🔧 Removendo scripts de teste antigos..."
rm -f test-db-integration.js
rm -f create-confirmed-user.js
rm -f emergency-test-login.js
rm -f test-auth-login-only.js
rm -f test-auth-fixed.js
rm -f executar-schema.js
rm -f teste-conexao-final.js
rm -f check-database-status.js
rm -f setup-database-direct.js
rm -f setup-database.js

# Deletar arquivos SQL antigos
echo "🗄️ Removendo arquivos SQL antigos..."
rm -f fix-trigger-auth.sql
rm -f verificacao-final.sql
rm -f database-schema-complete.sql

# Deletar pasta de código antigo
echo "�� Removendo pasta de código antigo..."
rm -rf "CODIGO AMIGO - NAO USAR/"

# Deletar arquivos .DS_Store
echo "�� Removendo arquivos do macOS..."
find . -name ".DS_Store" -delete

echo "✅ Limpeza concluída!"
echo "�� Arquivos removidos: ~20+"
echo "�� Projeto agora está limpo e organizado!"
