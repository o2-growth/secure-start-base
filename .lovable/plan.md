

# Plano: Corrigir tela branca — instalar @dnd-kit

## Problema
A tela está em branco porque o Vite não consegue resolver o import `@dnd-kit/core` em `KanbanBoard.tsx`. Os pacotes estão listados no `package.json` mas não estão instalados no ambiente.

## Solução

### 1. Instalar os pacotes @dnd-kit
Adicionar as dependências `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities` ao projeto (reinstalar via package.json).

Isso resolverá o erro de import e permitirá que o app carregue normalmente.

### 2. Verificar se a página Index redireciona corretamente
A rota `/` faz `Navigate to="/dashboard"`, que é protegida. Sem login, deve redirecionar para `/login`. Confirmar que o fluxo funciona após a correção do import.

## Resultado esperado
- App carrega sem erros
- Usuário não logado é redirecionado para `/login`
- Tela de login aparece corretamente

