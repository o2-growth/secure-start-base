

## Fase 2: Core CRM - Plano de Implementação

### Resumo
Implementar o Kanban board funcional, cadastro de lead com validação de duplicidade, card details com timeline e activity log, e movimentação de cards entre fases com validação de campos obrigatórios.

---

### Entrega 1: Hooks e serviços de dados

**Novos hooks:**
- `usePipelineBoard.ts` — busca cards de um pipeline com lead, phase, owner; agrupa por fase
- `useCard.ts` — busca card individual com lead, field values, activities, meetings
- `useCreateLead.ts` — mutation: valida duplicidade → insere lead → cria card na fase 1 → registra activity
- `useLeadValidation.ts` — checa duplicidade por email/phone/document na tabela leads
- `useMoveCard.ts` — mutation: valida campos obrigatórios da fase destino → atualiza current_phase_id → registra activity type "move"

---

### Entrega 2: Kanban Board (`PipelineBoard.tsx`)

Substituir o placeholder atual por board funcional:
- Header com nome do pipeline, BU badge, botão "Novo Lead"
- Colunas por fase (ordenadas por `position`), cada uma mostrando contagem de cards
- Cards mostrando: nome do lead, owner, status badge, data de criação
- Drag-and-drop usando `@dnd-kit/core` + `@dnd-kit/sortable` (lib leve e acessível)
- Ao soltar card em nova fase: dispara `useMoveCard` que valida campos obrigatórios antes de persistir
- States: loading (skeleton columns), empty (mensagem por coluna), error

**Componentes novos:**
- `KanbanBoard.tsx` — container com DndContext
- `KanbanColumn.tsx` — coluna droppable com header e lista de cards
- `CardTile.tsx` — card draggable compacto
- `PhaseGuardDialog.tsx` — dialog modal que lista campos obrigatórios faltantes ao tentar mover

---

### Entrega 3: Cadastro de Lead (`NewLead.tsx`)

Substituir placeholder por formulário funcional:
- Campos: nome, email, telefone, documento, empresa, origem, observações
- Validação client-side com zod + react-hook-form
- Ao submeter: primeiro checa duplicidade (query em leads por email/phone/document no mesmo org)
- Se duplicata encontrada: exibe `LeadValidationAlert` com dados do lead existente
  - Admin/enablement veem botão "Criar mesmo assim" (override)
  - Outros perfis: bloqueado
- Se válido: insere lead → cria card na fase 1 do pipeline → registra activity → redirect para card details
- States: form, loading, duplicate alert, success redirect, error

**Componente novo:**
- `LeadValidationAlert.tsx` — alert com dados do lead duplicado e ação de override

---

### Entrega 4: Card Details (`CardDetails.tsx`)

Substituir placeholder por página completa:
- Header: nome do lead, status badge, fase atual, owner
- Seção de campos: lista card_field_values editáveis (baseado em pipeline_fields)
- `CardForm.tsx` — formulário inline para editar campos do card
- `ActivityTimeline.tsx` — timeline vertical de activities ordenada por created_at desc
  - Ícones por tipo (note, email, whatsapp, meeting, move, contract, system)
  - Payload formatado por tipo
- Ação "Adicionar nota" — insere activity type "note"
- Botão de mover fase com select de fases disponíveis + validação
- States: loading, error, empty timeline

---

### Detalhes Técnicos

**Dependência npm nova:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Queries Supabase no board:**
```text
cards query:
  from("cards")
  .select("*, leads(full_name, email, phone, company_name), 
           pipeline_phases(name, position), 
           profiles!cards_owner_profile_id_fkey(full_name)")
  .eq("pipeline_id", pipelineId)
  .in("status", ["open"])
```

**Validação de duplicidade (client-side query):**
```text
from("leads")
  .select("id, full_name, email, phone, document")
  .eq("organization_id", orgId)
  .or(`email.eq.${email},phone.eq.${phone},document.eq.${doc}`)
```

**Validação de fase (move card):**
```text
1. Buscar pipeline_fields onde phase_id = targetPhaseId AND required = true
2. Buscar card_field_values do card
3. Comparar: se algum required field não tem value → bloquear e mostrar dialog
```

**RLS:** Todas as queries já são protegidas pelas policies existentes. Nenhuma migração necessária — o schema já suporta tudo.

**Arquivos criados/modificados:**
- `src/hooks/usePipelineBoard.ts` (novo)
- `src/hooks/useCard.ts` (novo)
- `src/hooks/useCreateLead.ts` (novo)
- `src/hooks/useLeadValidation.ts` (novo)
- `src/hooks/useMoveCard.ts` (novo)
- `src/components/KanbanBoard.tsx` (novo)
- `src/components/KanbanColumn.tsx` (novo)
- `src/components/CardTile.tsx` (novo)
- `src/components/CardForm.tsx` (novo)
- `src/components/LeadValidationAlert.tsx` (novo)
- `src/components/ActivityTimeline.tsx` (novo)
- `src/components/PhaseGuardDialog.tsx` (novo)
- `src/pages/pipelines/PipelineBoard.tsx` (reescrito)
- `src/pages/pipelines/NewLead.tsx` (reescrito)
- `src/pages/pipelines/CardDetails.tsx` (reescrito)

