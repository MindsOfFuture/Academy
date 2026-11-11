# 024 — Teste do Laboratório de Gestão com nome e CPF

Status: implementada
Constituição: `specs/constitution.md`

## Problema

Participantes do teste do Laboratório de Gestão precisam entrar rapidamente, e a coordenação precisa acompanhar acesso e conclusão da jornada.

## Escopo

O participante entra apenas com nome e CPF e segue diretamente para a Jornada completa do Laboratório de Gestão. A coordenação acompanha acessos, módulos abertos, módulos concluídos e conclusão da jornada, e baixa os dados em planilha.

**Fora de escopo:** alterar a Jornada completa, os módulos estáticos ou a telemetria existente do Laboratório de Gestão; oferecer esse acesso a outros aplicativos.

## Critérios de aceite

- [x] Dado um nome e CPF válidos, quando a pessoa entra, então chega à Jornada completa do Laboratório de Gestão.
- [x] Dado um CPF já usado, quando a pessoa entra novamente, então a mesma participação ganha mais um acesso.
- [x] Dado um CPF inválido ou excesso de tentativas, quando a pessoa envia, então vê um erro e não entra.
- [x] Dada uma coordenadora, quando abre o painel, então vê totais e o progresso da jornada por pessoa e baixa CSV com CPF completo.
- [x] Sem permissão: bolsistas e demais usuários não veem o painel nem recebem seus dados.

## Plano

- **Degrau da escada:** reaproveitar autenticação Supabase e a telemetria já registrada pela Jornada completa.
- **Arquivos:** página e action de teste; camada de dados; painel e CSV; migration; testes; middleware e abas.
- **Dados:** participante ligado ao usuário; resumo combina participante e eventos `lg2_module_opened`, `lg2_module_completed` e `lg2_journey_completed`; migration `20261111_teste_nome_cpf.sql`.
- **Autorização:** entrada pública com service role restrita ao fluxo; painel pelo cliente autenticado, guard de coordenação e função SQL com definer.
- **Dependência nova:** nenhuma.
- **Atalhos:** rate limit em memória já documentado em `lib/rate-limit.ts`.

## Tarefas

- [x] Entrada com nome e CPF — `app/teste/`
- [x] Resumo e CSV de coordenação — `app/gestao/testes/`
- [x] Dados e autorização — `lib/api/`
- [x] Migration — `supabase/migrations/20261111_teste_nome_cpf.sql`
- [x] Testes de validação, entrada, painel, CSV e SQL — `tests/`

## Aberto

Nenhuma decisão pendente.
