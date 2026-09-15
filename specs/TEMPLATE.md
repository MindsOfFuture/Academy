# NNN — <título>

Status: rascunho | aprovada | implementada
Constituição: `specs/constitution.md`

## Problema

Quem trava hoje, em quê. Uma frase. Se não dá pra nomear o usuário (aluno,
professor, admin) e a dor, a feature não existe ainda.

## Escopo

O que o usuário passa a conseguir fazer. Sem nome de tabela, componente ou lib.

**Fora de escopo:** o que foi cortado de propósito. Vazio aqui = escopo não pensado.

## Critérios de aceite

Cada linha é verificável por alguém que não leu o código.

- [ ] Dado <estado>, quando <ação>, então <resultado observável>
- [ ] Sem permissão: <o que o usuário vê>

## Plano

Só depois da spec aprovada.

- **Degrau da escada:** o que já existe no repo e foi reusado, ou por que nada servia.
- **Arquivos:** lista fechada. Cresceu na implementação? Volta aqui.
- **Dados:** tabelas/colunas tocadas + migration em `supabase/migrations/` se houver.
- **Autorização:** qual cliente Supabase, qual `ensure…()`, entra em `PUBLIC_PATH_PREFIXES`?
- **Dependência nova:** nenhuma, ou o motivo de nada instalado resolver.
- **Atalhos:** cada `// ponytail:` planejado, com o teto.

## Tarefas

- [ ] <mudança> — `arquivo`
- [ ] Teste: <a asserção que quebra se a lógica quebrar> — `tests/...`

## Aberto

Decisões que faltam. Bloqueiam aprovação, não implementação parcial.
