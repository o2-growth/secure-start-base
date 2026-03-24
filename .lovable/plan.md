

# Plano: Criar todas as tabelas no banco de dados e corrigir erros de build

## Problema
O banco de dados está vazio, mas o código referencia ~15 tabelas. Isso causa todos os erros de tipo `'table_name' is not assignable to parameter of type 'never'`. Além disso, faltam declarações de tipo para `@dnd-kit`.

## Etapas

### 1. Migração SQL — criar todas as tabelas, enums, RLS e triggers

Tabelas a criar (baseado no código existente):

- **organizations** (id, name, type `hq|franchise`, created_at)
- **business_units** (id, name, slug, organization_id FK, active, created_at)
- **profiles** (id, auth_user_id FK unique, full_name, email, organization_id FK, business_unit_id FK nullable, active, created_at)
- **user_roles** (id, user_id FK auth.users, role `app_role` enum, unique user_id+role)
- **pipelines** (id, name, business_unit_id FK, audience `internal|franchise`, active, created_at)
- **pipeline_phases** (id, pipeline_id FK, name, position, is_final, created_at)
- **pipeline_fields** (id, pipeline_id FK, label, key, type `field_type` enum, required, phase_id FK nullable, visible_on_card, visible_on_start_form, position, options jsonb)
- **leads** (id, organization_id FK, full_name, email, phone, document, company_name, source, created_at)
- **cards** (id, lead_id FK, pipeline_id FK, current_phase_id FK, owner_profile_id FK nullable, status, origin, contract_status nullable, created_at, updated_at)
- **card_field_values** (id, card_id FK, pipeline_field_id FK, value jsonb, updated_by uuid, created_at)
- **activities** (id, card_id FK, type, payload jsonb, created_by uuid nullable, created_at)
- **automation_rules** (id, pipeline_id FK, trigger_type `automation_trigger` enum, conditions jsonb, actions jsonb, active, created_at)
- **automation_runs** (id, rule_id FK, card_id uuid nullable, status, executed_at, error_message nullable)
- **message_templates** (id, name, channel `message_channel` enum, category, subject nullable, body text, active, created_at)
- **meeting_records** (id, card_id FK, provider, meeting_url, external_id nullable, occurred_at, summary nullable, created_at)
- **integration_connections** (id, organization_id FK, provider, active, config jsonb, last_sync_at nullable, created_at)
- **contracts** (id, card_id FK, status, content jsonb, created_at, updated_at)

Enums a criar:
- `app_role`: admin, enablement, head, closer, sdr, bdr
- `field_type`: text, number, email, textarea, select, date, phone
- `automation_trigger`: phase_change, field_update, time_based, lead_created
- `message_channel`: email, whatsapp
- `pipeline_audience`: internal, franchise
- `org_type`: hq, franchise

Função `has_role` security definer para RLS.

RLS policies em todas as tabelas para usuários autenticados (select, insert, update).

Trigger para criar profile automaticamente ao signup (`handle_new_user`).

### 2. Adicionar declarações de tipo para @dnd-kit

Criar arquivo `src/dnd-kit.d.ts` com `declare module` para `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities` (os pacotes já estão no package.json mas faltam tipos).

### 3. Corrigir tipagem em `permissions.ts`

O `AppRole` referencia `Database["public"]["Enums"]["app_role"]` que resolverá automaticamente após a migração regenerar os tipos. Mas como medida de segurança, usar tipo literal como fallback.

## Detalhes técnicos

- Uma única migração SQL grande criará toda a estrutura
- O `types.ts` será regenerado automaticamente após a migração
- Os erros de build vão desaparecer quando os tipos refletirem as tabelas reais
- As RLS policies permitirão operações para usuários autenticados
- O trigger `handle_new_user` criará o profile automaticamente ao signup

