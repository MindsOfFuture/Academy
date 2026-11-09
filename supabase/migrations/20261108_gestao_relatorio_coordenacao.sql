-- A coordenação lê o relatório dos bolsistas (aba Equipe → "Registro de atividades").
--
-- Antes só o dono lia a própria atividade. Agora a coordenação também lê, para
-- acompanhar e atestar o mês. Outro bolsista continua sem ver. Segue a
-- separação do E2E (20261019): coordenação real não lê atividade de conta de
-- teste, e vice-versa. Idempotente.

begin;

drop policy if exists "coordenacao_le" on gestao.atividade_relatorio;
create policy "coordenacao_le" on gestao.atividade_relatorio
  for select to authenticated
  using (
    gestao.usuario_com_papel('coordenacao')
    and exists (
      select 1 from gestao.papel_membro m
      where m.user_profile_id = atividade_relatorio.user_profile_id
        and m.teste = gestao.sou_teste()
    )
  );

commit;
