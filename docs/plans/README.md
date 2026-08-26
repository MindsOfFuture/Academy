# Planos

Estudos de viabilidade e propostas **não aprovadas**. Nada aqui está implementado.

Um plano só sai desta pasta de duas formas: virando código (e então ADR em
`docs/decisions.md`), ou virando bloco de descarte com o motivo. Plano parado
sem decisão é dívida de contexto — quem lê o repo não sabe se é roadmap ou lixo.

| Plano | Escopo | Status |
|---|---|---|
| [sistema-interno-gestao.md](sistema-interno-gestao.md) | Módulo `/gestao`: alocação de bolsista, relatório mensal, prestação de contas | proposta |
| [portal-de-ideias.md](portal-de-ideias.md) | Captura e triagem de ideias da equipe interna e bolsistas | proposta |
| [repositorio-skills-artifacts.md](repositorio-skills-artifacts.md) | Catálogo interno de Claude Skills e Artifacts do time | proposta |

Formato esperado: veredito no topo, riscos com severidade, estimativa em faixa,
bloqueadores antes da primeira linha de código, e uma seção do que foi deixado
de fora **de propósito**. Documento que só lista funcionalidade não é plano.

Contexto obrigatório de leitura antes de mexer em qualquer um:
`docs/decisions.md` (ADRs), `docs/deploy-vps.md` (infra), `docs/supabase.md`
(qual cliente usar) e `specs/constitution.md`.
