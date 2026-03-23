-- ============================================================
-- SEED: O2 Inc. organization, BUs, pipelines, phases, automations
-- ============================================================

-- 1. Organization: O2 Inc. (HQ)
INSERT INTO public.organizations (id, name, type, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'O2 Inc.', 'hq', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Business Units
INSERT INTO public.business_units (id, organization_id, name, slug, active) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Modelo Atual',  'modelo-atual', true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Tax',           'tax',          true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Expansão',      'expansao',     true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Educação',      'educacao',     true)
ON CONFLICT (id) DO NOTHING;

-- 3. Pipelines (internal, one per BU)
INSERT INTO public.pipelines (id, business_unit_id, audience, name, active) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'internal', 'Pipeline Modelo Atual', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'internal', 'Pipeline Tax',          true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'internal', 'Pipeline Expansão',     true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'internal', 'Pipeline Educação',     true)
ON CONFLICT (id) DO NOTHING;

-- 4. Pipeline Phases (6 per pipeline)
-- Modelo Atual
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Novo Lead',           1, false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Qualificação',        2, false),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Reunião Agendada',    3, false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Proposta/Negociação', 4, false),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Fechado Ganha',       5, true),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Fechado Perdida',     6, true)
ON CONFLICT (id) DO NOTHING;

-- Tax
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Novo Lead',           1, false),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'Qualificação',        2, false),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', 'Reunião Agendada',    3, false),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002', 'Proposta/Negociação', 4, false),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002', 'Fechado Ganha',       5, true),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000002', 'Fechado Perdida',     6, true)
ON CONFLICT (id) DO NOTHING;

-- Expansão
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003', 'Novo Lead',           1, false),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003', 'Qualificação',        2, false),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000003', 'Reunião Agendada',    3, false),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000003', 'Proposta/Negociação', 4, false),
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000003', 'Fechado Ganha',       5, true),
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000003', 'Fechado Perdida',     6, true)
ON CONFLICT (id) DO NOTHING;

-- Educação
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004', 'Novo Lead',           1, false),
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004', 'Qualificação',        2, false),
  ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000004', 'Reunião Agendada',    3, false),
  ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000004', 'Proposta/Negociação', 4, false),
  ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000004', 'Fechado Ganha',       5, true),
  ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000004', 'Fechado Perdida',     6, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Start forms (one per pipeline)
INSERT INTO public.start_forms (id, pipeline_id, name, schema, active) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Formulário Modelo Atual',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Formulário Tax',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Formulário Expansão',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Formulário Educação',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Message Templates
INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000001', 'email', 'transactional', 'Boas-vindas Email',
   'Bem-vindo à O2!',
   '<p>Olá {{nome}},</p><p>Seja bem-vindo! Em breve entraremos em contato.</p><p>Equipe O2</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000002', 'whatsapp', 'transactional', 'Boas-vindas WhatsApp',
   NULL,
   'Olá {{nome}}! Seja bem-vindo à O2. Em breve entraremos em contato. 😊',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000011', 'email', 'followup', 'Follow-up 3 dias',
   'Acompanhamento — O2',
   '<p>Olá {{nome}},</p><p>Gostaria de dar continuidade à nossa conversa. Podemos conversar?</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000012', 'email', 'followup', 'Follow-up 6 dias',
   'Retorno — O2',
   '<p>Olá {{nome}},</p><p>Estou entrando em contato novamente para verificar se posso ajudar.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000013', 'email', 'followup', 'Follow-up 9 dias',
   'Verificação — O2',
   '<p>Olá {{nome}},</p><p>Quero garantir que você tenha todas as informações necessárias.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000014', 'email', 'followup', 'Follow-up 14 dias',
   'Última tentativa — O2',
   '<p>Olá {{nome}},</p><p>Faço mais esta tentativa de contato. Podemos conversar?</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000015', 'email', 'followup', 'Follow-up 21 dias',
   'Oportunidade — O2',
   '<p>Olá {{nome}},</p><p>Estou disponível para tirar dúvidas sobre nossas soluções.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000016', 'email', 'followup', 'Follow-up 30 dias',
   'Um mês de contato — O2',
   '<p>Olá {{nome}},</p><p>Já faz 30 dias desde nosso primeiro contato. Ainda posso ajudar?</p>',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000021', 'whatsapp', 'followup', 'Follow-up 3 dias WA',
   NULL, 'Olá {{nome}}! Só passando para verificar se ficou alguma dúvida. Posso ajudar? 🤝',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000022', 'whatsapp', 'followup', 'Follow-up 6 dias WA',
   NULL, 'Oi {{nome}}! Estou entrando em contato novamente. Quando podemos conversar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000023', 'whatsapp', 'followup', 'Follow-up 9 dias WA',
   NULL, 'Olá {{nome}}! Quero garantir que você tenha todas as informações. Posso ajudar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000024', 'whatsapp', 'followup', 'Follow-up 14 dias WA',
   NULL, 'Oi {{nome}}! Faço mais esta tentativa de contato. Tem interesse em conversar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000025', 'whatsapp', 'followup', 'Follow-up 21 dias WA',
   NULL, 'Olá {{nome}}! Ainda estou disponível para apresentar nossas soluções. 😊',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000026', 'whatsapp', 'followup', 'Follow-up 30 dias WA',
   NULL, 'Oi {{nome}}! Já se passou um mês. Ainda posso te ajudar com algo?',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Automation Rules: boas-vindas + 6 follow-ups por pipeline
-- Modelo Atual
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000001', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);

-- Tax
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);

-- Expansão
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);

-- Educação
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);
