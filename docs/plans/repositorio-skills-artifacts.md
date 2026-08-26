# Repositório interno de Skills e Artifacts — estudo de viabilidade

Status: **proposta, não aprovada**. Nada implementado. Documento para discussão
com a coordenação e decisão posterior.

Escopo avaliado: catálogo interno para o time publicar, versionar, descobrir e
instalar **Claude Skills** (pacotes `.skill`) e **Artifacts** (páginas HTML/MD
autocontidas) produzidos no projeto. Nos moldes de um registry como o Synapse,
porém restrito à equipe do Minds of the Future.

Contexto: `docs/plans/sistema-interno-gestao.md` · Decisões: `docs/decisions.md`
001, 002, 005, 008, 013, 014.

---

## Veredito

**Viável tecnicamente — e o de menor prioridade dos três planos.**

Nada aqui é difícil: é upload de arquivo, metadado, busca e download assinado.
O problema é de **massa crítica**. Registry só se paga quando existe volume de
ativos e gente suficiente para que buscar seja mais barato que refazer. Com um
punhado de skills e um time pequeno, uma pasta versionada no Git resolve o mesmo
problema por zero hora de trabalho.

Recomendação: **não construir agora**. Adotar a opção B abaixo, medir por três
meses e só promover para produto se o número de ativos e de consumidores
justificar. Construir antes disso é o caso-livro de otimização prematura.

## Gatilho de decisão

Este plano sai da gaveta quando **os três** forem verdade ao mesmo tempo:

| Sinal | Limiar sugerido |
|---|---|
| Ativos publicados e realmente usados | ≥ 20 |
| Pessoas distintas consumindo (não só o autor) | ≥ 5 |
| Casos observados de "refizeram porque não acharam" | ≥ 3 |

Abaixo disso, a dor é de **descoberta**, não de **distribuição** — e descoberta
se resolve com um `README.md` bom, não com um registry.

## Onde o módulo vive

| Opção | Esforço | Versionamento | Veredito |
|---|---|---|---|
| **B — pasta `skills/` em repo Git dedicado + README índice** | ~zero | Git nativo | **recomendada agora** |
| A — `/gestao/repositorio`, Supabase Storage + schema `gestao` | médio | manual, no schema | promover só ao atingir o gatilho |
| C — serviço próprio com registry e CLI | alto | próprio | descartada |
| D — registry externo de terceiro | baixo | terceiro | descartada: ativo institucional em plataforma fora do convênio |

A opção B entrega o essencial de graça: histórico, diff, revisão por PR, controle
de acesso e clone. O que ela **não** entrega é instalação por um clique para quem
não usa Git — que é exatamente o gap que a opção A justificaria, se ele existir.

Verificar antes de decidir: **quem são os consumidores que não usam Git?** Se a
resposta for "ninguém", o plano acaba aqui.

## Desenho, se a opção A for adotada

Guardrails idênticos aos dos outros módulos internos:

1. **Schema `gestao.*`**, migration versionada desde a primeira tabela (ADR 008).
2. **RLS própria**; `createServiceRoleClient()` é bloqueio de merge (ADR 002).
3. **Toda query por `lib/api/`** (ADR 005).
4. **Rota fora de `PUBLIC_PATH_PREFIXES`**, papel checado no servidor.
5. **Feature flag**.

### Modelo

| Tabela | Papel |
|---|---|
| `gestao.ativo` | tipo (`skill` \| `artifact`), nome, descrição, autor, visibilidade, timestamps |
| `gestao.ativo_versao` | semver, changelog, `storage_path`, checksum, tamanho, publicado_em |
| `gestao.ativo_download` | log append-only: quem baixou o quê e quando |

Versão é **imutável**. Corrigir = publicar `x.y.z+1`, nunca sobrescrever o
arquivo. Registry que deixa mutar versão publicada torna impossível reproduzir o
comportamento de ontem — e é o defeito mais caro de reverter depois.

### Armazenamento e a armadilha do Storage

Binário vai para **Supabase Storage em bucket privado**, com URL assinada de
tempo curto emitida no servidor. Nunca no disco do VPS, que é sobrescrito a cada
deploy (`docs/deploy-vps.md`).

Precedente que **não** deve ser reusado: `lib/supabase/student_projects.ts#uploadFile`
devolve **URL pública**, sem sanitização de nome nem limite de tamanho
(`docs/supabase.md#storage`). Reaproveitar esse caminho por conveniência é o modo
mais provável de expor ativo interno na internet aberta.

### Validação no upload — não negociável

Aceitar arquivo de terceiro é a maior superfície de risco do módulo. Mínimo:

- **limite de tamanho** e extensão em allowlist (`.skill`, `.zip`, `.html`, `.md`);
- **nome de arquivo sanitizado** e path de storage gerado pelo servidor, nunca
  derivado do nome enviado (path traversal);
- `.skill` é zip: **checar entradas antes de expandir** — caminho absoluto ou
  `../` rejeitam o pacote (zip-slip); teto de arquivos e de tamanho expandido;
- **checksum registrado** na versão, exibido no download;
- **Artifact HTML nunca renderizado inline no domínio do Academy.** Servir como
  download, ou em domínio/sandbox separado. HTML arbitrário servido no mesmo
  origin é XSS armazenado com sessão de admin junto — o pior cenário do repo.

Este último item é o que transforma um catálogo simples em decisão de segurança.
Se a preview inline for exigida, o escopo muda de categoria e o plano precisa ser
reavaliado inteiro.

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Artifact HTML renderizado no mesmo origin → XSS com sessão de admin | **alta** | download ou domínio separado; nunca inline |
| `.skill` malicioso (zip-slip, bomba de descompressão) | **alta** | validar entradas antes de expandir; tetos; checksum |
| Bucket público por reuso do `uploadFile` existente | alta | bucket privado + URL assinada; revisão obrigatória do PR |
| Construir registry sem massa crítica → catálogo vazio | alta | gatilho de decisão acima; começar pela opção B |
| Credencial embutida em skill publicada pelo autor | média | política escrita + varredura de segredo no upload; ativo é revogável |
| Versão publicada sendo sobrescrita | média | imutabilidade por constraint, não por convenção |
| Ativo institucional preso ao autor que se forma | média | publicação exige licença/uso interno declarado; export do bucket no backup |
| Bus factor junto com o resto do `/gestao` | média | herda o bloco de Sucessão de `sistema-interno-gestao.md` |

## Estimativa

Como incremento do `/gestao`, com infra e `lib/api/` já de pé.

| Frente | Horas |
|---|---|
| Schema `gestao.ativo*` + RLS + migration | 8–10 |
| Upload com validação, sanitização e checksum | 14–20 |
| Storage privado + emissão de URL assinada | 8–10 |
| `lib/api/ativos.ts` + route handlers | 10–12 |
| UI: catálogo, busca, detalhe, publicação | 16–22 |
| Versionamento e changelog | 8–10 |
| Testes (unit + fluxo de upload/download) | 10–14 |
| **Total** | **74–98** |

Comparar com a opção B: **1–2 h** para criar o repo e escrever o índice.
A diferença é o preço da conveniência de instalação — e é ela que precisa ser
justificada por uso real, não por elegância.

## Bloqueadores antes da primeira linha de código

1. **Gatilho de decisão atingido** (20 ativos / 5 consumidores / 3 retrabalhos).
   Antes disso, opção B.
2. **Resposta a "quem consome sem usar Git?"** — se ninguém, o módulo não tem
   razão de existir.
3. **Decisão sobre preview inline de Artifact.** Muda a postura de segurança e a
   arquitetura de servir arquivo.
4. **`/gestao` aprovado e com schema de pé.** Módulo dependente.

## Não feito de propósito

- **CLI de instalação** — só faz sentido com dezenas de ativos e consumo diário.
  Enquanto for download manual, não construir.
- **Compartilhamento externo / marketplace público** — ativo é institucional e o
  convênio não tem termo para distribuição externa. Fora de escopo até haver
  decisão jurídica.
- **Execução de skill dentro do Academy** — o Academy é plataforma educacional,
  não runtime de agente. Executar código de terceiro no processo que serve aluno
  é linha que não se cruza.
- **Resolução de dependência entre ativos** — problema de gerenciador de pacote.
  Com este volume, não existe.
- **Estrela, comentário, ranking** — governança social sem população. Log de
  download já responde "isso é usado?".
