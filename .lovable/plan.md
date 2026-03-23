

## Fase 4: Base de Integrações — Plano

### Objetivo
Criar toda a infraestrutura (edge functions, services, hooks, UI no CardDetails) para Brevo, WhatsApp, Google Meet, Elephan e Contratos. As funções ficam prontas como "stub" — sem chamadas reais a APIs externas — para que depois baste injetar as credenciais e payloads finais.

---

### 1. Edge Functions (stubs com interface definida)

Criar 6 edge functions, cada uma recebendo payload tipado, validando com lógica mínima, e salvando registros nas tabelas existentes (`message_deliveries`, `meeting_records`, `contracts`, `activities`). Nenhuma chama API externa ainda.

- **`send-brevo-email`** — recebe `{ card_id, template_id }`, busca template em `message_templates`, insere `message_deliveries` com status `pending`, registra activity tipo `email`. Placeholder para chamada Brevo.
- **`send-whatsapp`** — recebe `{ card_id, template_id, phone }`, insere `message_deliveries` canal `whatsapp`, registra activity tipo `whatsapp`. Placeholder para chamada WhatsApp API.
- **`meet-webhook`** — recebe `{ card_id, meeting_url, meeting_external_id, occurred_at }`, insere em `meeting_records` provider `google_meet`, registra activity tipo `meeting`.
- **`elephan-webhook`** — recebe `{ card_id, meeting_external_id, transcript_text, recording_url, summary }`, faz upsert em `meeting_records` provider `elephan`, registra activity.
- **`generate-contract`** — recebe `{ card_id }`, valida que caller é closer/admin, insere em `contracts` status `draft`, atualiza `cards.contract_status = 'draft'`, registra activity tipo `contract`.
- **`nightly-followups`** — busca `automation_runs` com status `pending` cujo `scheduled_for` <= now, marca como `running`, cria `message_deliveries`, marca como `success`. Cron-ready.

### 2. Migration: RLS para insert em meeting_records e message_deliveries

As tabelas `meeting_records` e `message_deliveries` atualmente não permitem INSERT/UPDATE pelo authenticated role. Precisamos de policies para as edge functions usarem service role, mas também para o `generate-contract` funcionar via client (contracts já tem INSERT policy).

Adicionar:
- UPDATE policy em `contracts` para admin/enablement/closer
- UPDATE policy em `cards` `contract_status` (já coberto pela cards_update existente)

### 3. Service layer (`src/lib/services/`)

Criar arquivos de serviço tipados que chamam as edge functions via `supabase.functions.invoke()`:

- `brevo.service.ts` — `sendBrevoEmail(cardId, templateId)`
- `whatsapp.service.ts` — `sendWhatsApp(cardId, templateId, phone)`
- `meet.service.ts` — `attachMeeting(cardId, meetingUrl, externalId)`
- `elephan.service.ts` — (webhook only, sem service client)
- `contracts.service.ts` — `generateContract(cardId)`

### 4. Hooks

- `useContractGeneration.ts` — mutation que chama `contracts.service.generateContract`, invalida queries do card
- `useMeetingData.ts` — query que busca `meeting_records` do card + mutation para attach meeting
- `useSendMessage.ts` — mutation genérica para disparar email/whatsapp via edge functions

### 5. UI no CardDetails

Adicionar 3 painéis na sidebar direita do CardDetails:

- **Painel de Contrato**: botão "Gerar Contrato" (visível apenas para closer/admin), badge de status do contrato
- **Painel de Reunião**: botão "Vincular Reunião" (input de URL do Meet), lista de meetings do card com transcrição/gravação quando disponível
- **Painel de Comunicação**: botões "Enviar E-mail" e "Enviar WhatsApp" com selector de template (`message_templates`), visíveis para quem tem acesso ao card

### 6. Admin: Templates de Mensagens

Adicionar rota `/admin/templates` com CRUD de `message_templates`:
- Listar templates por canal (email/whatsapp) e categoria (transactional/followup)
- Criar/editar: nome, canal, categoria, assunto, corpo, variáveis, BU, ativo
- Adicionar link na sidebar admin

---

### Arquivos

**Edge Functions (novas):**
- `supabase/functions/send-brevo-email/index.ts`
- `supabase/functions/send-whatsapp/index.ts`
- `supabase/functions/meet-webhook/index.ts`
- `supabase/functions/elephan-webhook/index.ts`
- `supabase/functions/generate-contract/index.ts`
- `supabase/functions/nightly-followups/index.ts`

**Services (novos):**
- `src/lib/services/brevo.service.ts`
- `src/lib/services/whatsapp.service.ts`
- `src/lib/services/meet.service.ts`
- `src/lib/services/contracts.service.ts`

**Hooks (novos):**
- `src/hooks/useContractGeneration.ts`
- `src/hooks/useMeetingData.ts`
- `src/hooks/useSendMessage.ts`

**Pages (novas/editadas):**
- `src/pages/admin/MessageTemplates.tsx` (novo)
- `src/pages/pipelines/CardDetails.tsx` (editado — painéis de contrato, reunião, comunicação)
- `src/App.tsx` (editado — rota `/admin/templates`)
- `src/components/AppSidebar.tsx` (editado — link Templates)

**Migration:**
- Uma migration para UPDATE policy em `contracts` para closer/admin/enablement

