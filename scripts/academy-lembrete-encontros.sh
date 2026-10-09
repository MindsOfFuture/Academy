#!/bin/sh
# Lembrete por e-mail nas 24 h antes do encontro (spec 016). Roda de hora em hora
# pelo academy-lembrete-encontros.timer (RUNBOOK §8.5).
#
# O banco escolhe quem recebe e monta o e-mail (gestao.lembretes_pendentes); aqui
# só se envia pelo Resend e se marca como enviado. Entra no banco com o papel
# gestao_lembrete, que só executa essas duas funções: sem chave de serviço
# (ADR 021). Não loga destinatário nem conteúdo (dado pessoal, RUNBOOK §8.1).
#
# Falhou no meio? O que não foi marcado sai de novo na hora seguinte.
set -eu

: "${GESTAO_LEMBRETE_DB_URL:?defina em /etc/academy.env}"
: "${RESEND_API_KEY:?}"
: "${RESEND_FROM_EMAIL:?}"
: "${NEXT_PUBLIC_APP_URL:?}"

tab=$(printf '\t')
enviados=0

pendentes=$(
  psql "$GESTAO_LEMBRETE_DB_URL" -X -q -At -F "$tab" -v ON_ERROR_STOP=1 \
    -v de="$RESEND_FROM_EMAIL" -v url="$NEXT_PUBLIC_APP_URL" -v redir="${RESEND_TEST_RECIPIENT:-}" <<'SQL'
select alocacao_id, email from gestao.lembretes_pendentes(:'de', :'url', :'redir');
SQL
)

[ -z "$pendentes" ] && { echo "nenhum lembrete pendente"; exit 0; }

printf '%s\n' "$pendentes" | while IFS="$tab" read -r id corpo; do
  curl -fsS --max-time 30 https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$corpo" >/dev/null
  psql "$GESTAO_LEMBRETE_DB_URL" -X -q -v ON_ERROR_STOP=1 -v id="$id" >/dev/null <<'SQL'
select gestao.marcar_lembrete_enviado(:'id');
SQL
  enviados=$((enviados + 1))
  echo "lembrete enviado ($enviados)"
done
