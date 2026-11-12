#!/bin/sh
# Lembretes por e-mail da gestão. Roda de hora em hora pelo
# academy-lembrete-encontros.timer (RUNBOOK §8.6):
#   - encontro nas próximas 24 h (spec 016), uma vez por alocação;
#   - meta atrasada, uma vez por responsável e prazo.
#
# O banco escolhe quem recebe e monta o e-mail (gestao.lembretes_pendentes,
# gestao.lembretes_meta_pendentes); aqui só se envia pelo Resend e se marca como
# enviado. Entra no banco com o papel gestao_lembrete, que só executa essas
# funções: sem chave de serviço (ADR 021). Não loga destinatário nem conteúdo
# (dado pessoal, RUNBOOK §8.1).
#
# Falhou no meio? O que não foi marcado sai de novo na hora seguinte.
set -eu

: "${GESTAO_LEMBRETE_DB_URL:?defina em /etc/academy.env}"
: "${RESEND_API_KEY:?}"
: "${RESEND_FROM_EMAIL:?}"
: "${NEXT_PUBLIC_APP_URL:?}"

tab=$(printf '\t')

consultar() {
  psql "$GESTAO_LEMBRETE_DB_URL" -X -q -At -F "$tab" -v ON_ERROR_STOP=1 \
    -v de="$RESEND_FROM_EMAIL" -v url="$NEXT_PUBLIC_APP_URL" -v redir="${RESEND_TEST_RECIPIENT:-}"
}

enviar() {
  curl -fsS --max-time 30 https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$1" >/dev/null
}

# --- Encontros -------------------------------------------------------------
pendentes=$(consultar <<'SQL'
select alocacao_id, email from gestao.lembretes_pendentes(:'de', :'url', :'redir');
SQL
)

if [ -z "$pendentes" ]; then
  echo "nenhum lembrete de encontro pendente"
else
  printf '%s\n' "$pendentes" | while IFS="$tab" read -r id corpo; do
    enviar "$corpo"
    psql "$GESTAO_LEMBRETE_DB_URL" -X -q -v ON_ERROR_STOP=1 -v id="$id" >/dev/null <<'SQL'
select gestao.marcar_lembrete_enviado(:'id');
SQL
    echo "lembrete de encontro enviado"
  done
fi

# --- Metas atrasadas -------------------------------------------------------
metas=$(consultar <<'SQL'
select meta_id, user_profile_id, prazo, email from gestao.lembretes_meta_pendentes(:'de', :'url', :'redir');
SQL
)

if [ -z "$metas" ]; then
  echo "nenhum lembrete de meta pendente"
else
  printf '%s\n' "$metas" | while IFS="$tab" read -r meta pessoa prazo corpo; do
    enviar "$corpo"
    psql "$GESTAO_LEMBRETE_DB_URL" -X -q -v ON_ERROR_STOP=1 \
      -v meta="$meta" -v pessoa="$pessoa" -v prazo="$prazo" >/dev/null <<'SQL'
select gestao.marcar_lembrete_meta_enviado(:'meta', :'pessoa', :'prazo');
SQL
    echo "lembrete de meta enviado"
  done
fi
