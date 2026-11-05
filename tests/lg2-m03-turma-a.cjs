/* Teste do LG2 M03 (Turma A) — 22 perguntas reescritas (m03_reescritas.xlsx).
   Execute: PW=<pacote playwright> NODE_OPTIONS=--no-experimental-webstorage node tests/lg2-m03-turma-a.cjs
   Opcional: SHOTS=<pasta> grava prints de celular (390x844). Sai com código 1 se algo falhar. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PW || 'playwright');

const DIR = path.resolve(__dirname, '../public/lg2/turma-a/m03');
const CHAVE = 'lg2-turma-a-m03';
const SHOTS = process.env.SHOTS || '';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const servidor = http.createServer((req, res) => {
  const f = path.join(DIR, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

/* Aba "Caminhos por resposta": código, pergunta (B), resposta/opção (D), tipo de retorno (F), mensagem (G). Literal. */
const LINHAS = [
 {
  "codigo": "P01",
  "pergunta": "Com suas palavras, em que ramo você trabalha e o que você vende? (Ex.: \"Vendo marmitas para trabalhadores do bairro\")",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P01",
  "pergunta": "Com suas palavras, em que ramo você trabalha e o que você vende? (Ex.: \"Vendo marmitas para trabalhadores do bairro\")",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Diga o que você vende e para quem. Ex.: \"Vendo marmitas para trabalhadores do bairro\"."
 },
 {
  "codigo": "P01",
  "pergunta": "Com suas palavras, em que ramo você trabalha e o que você vende? (Ex.: \"Vendo marmitas para trabalhadores do bairro\")",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Mercado é o lugar, na rua ou na internet, onde quem vende encontra quem quer comprar. Prompt: \"Eu [descreva o que faz]. Me ajude a explicar em uma frase, em linguagem simples, em que ramo eu trabalho. Dê 3 exemplos de como outras pessoas descrevem esse ramo.\" Confira se a frase combina com o que você realmente faz."
 },
 {
  "codigo": "P02",
  "pergunta": "Você está procurando novas formas de vender mais ou de crescer agora?",
  "opcao": "Sim",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P02",
  "pergunta": "Você está procurando novas formas de vender mais ou de crescer agora?",
  "opcao": "Não",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P03",
  "pergunta": "Se o seu cliente não comprar de você, o que ele pode comprar no lugar? (Ex.: quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P03",
  "pergunta": "Se o seu cliente não comprar de você, o que ele pode comprar no lugar? (Ex.: quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense: se o cliente não comprasse de você, o que ele faria? Ex.: quem vende bolo caseiro perde cliente para a padaria."
 },
 {
  "codigo": "P03",
  "pergunta": "Se o seu cliente não comprar de você, o que ele pode comprar no lugar? (Ex.: quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote)",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Tudo bem. Pense em onde o cliente compraria se você não existisse. Você pode voltar e preencher depois."
 },
 {
  "codigo": "P04",
  "pergunta": "Você viu alguma novidade ou mudança recente que pode ajudar você a vender mais? (Ex.: mais gente comprando pelo WhatsApp, uma obra ou um evento novo perto de você)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P04",
  "pergunta": "Você viu alguma novidade ou mudança recente que pode ajudar você a vender mais? (Ex.: mais gente comprando pelo WhatsApp, uma obra ou um evento novo perto de você)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Conte uma novidade ou mudança recente. Ex.: mais gente comprando pelo WhatsApp, uma obra ou evento novo perto de você."
 },
 {
  "codigo": "P04",
  "pergunta": "Você viu alguma novidade ou mudança recente que pode ajudar você a vender mais? (Ex.: mais gente comprando pelo WhatsApp, uma obra ou um evento novo perto de você)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Onde olhar: converse com clientes, veja as redes sociais e as novidades do bairro. Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Que mudanças recentes (jeito de comprar, tecnologia, eventos) podem ajudar quem vende isso? Separe o que é fato do que é suposição.\" Confira em fonte confiável ou pergunte a clientes."
 },
 {
  "codigo": "P05",
  "pergunta": "Por que você acredita que essa ideia pode dar certo no seu negócio?",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P05",
  "pergunta": "Por que você acredita que essa ideia pode dar certo no seu negócio?",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Conte o motivo: já tem clientes pedindo? Já viu essa ideia dar certo? Quanto custa começar?"
 },
 {
  "codigo": "P05",
  "pergunta": "Por que você acredita que essa ideia pode dar certo no seu negócio?",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Minha ideia é [descreva a ideia]. Me faça 5 perguntas simples para eu descobrir se ela pode dar certo: se tem gente que compra, quanto custa começar e o que eu preciso ter.\" Responda cada pergunta com dados reais (clientes, preços, custos)."
 },
 {
  "codigo": "P06",
  "pergunta": "O que você já tem e o que ainda falta para colocar essa ideia em prática? (Ex.: dinheiro, equipamento, tempo, ajuda)",
  "opcao": "Já sei o que tenho e o que falta",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Quero colocar em prática [ideia]. Já tenho [o que você tem]. Explique, em linguagem simples, o que ainda falta.\" Confira a lista com a sua realidade antes de decidir."
 },
 {
  "codigo": "P06",
  "pergunta": "O que você já tem e o que ainda falta para colocar essa ideia em prática? (Ex.: dinheiro, equipamento, tempo, ajuda)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense em dinheiro, equipamento, tempo, licença e ajuda. O que você já tem? O que ainda falta?"
 },
 {
  "codigo": "P06",
  "pergunta": "O que você já tem e o que ainda falta para colocar essa ideia em prática? (Ex.: dinheiro, equipamento, tempo, ajuda)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Quero colocar em prática [ideia]. O que normalmente é preciso (dinheiro, equipamento, tempo, licença, ajuda)? Liste em ordem do que fazer primeiro.\""
 },
 {
  "codigo": "P07",
  "pergunta": "Existe alguma coisa que pode atrapalhar suas vendas? (Ex.: concorrente novo, preço dos insumos subindo, mudança de regra)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P07",
  "pergunta": "Existe alguma coisa que pode atrapalhar suas vendas? (Ex.: concorrente novo, preço dos insumos subindo, mudança de regra)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense no que pode atrapalhar. Ex.: concorrente novo, preço dos insumos subindo, mudança de regra."
 },
 {
  "codigo": "P07",
  "pergunta": "Existe alguma coisa que pode atrapalhar suas vendas? (Ex.: concorrente novo, preço dos insumos subindo, mudança de regra)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço]. Quais riscos comuns podem atrapalhar as vendas de quem trabalha com isso? Diga também o que dá para fazer para se proteger.\""
 },
 {
  "codigo": "P08",
  "pergunta": "Nos próximos anos, o que você acha que vai mudar na forma como as pessoas compram o que você vende? (Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P08",
  "pergunta": "Nos próximos anos, o que você acha que vai mudar na forma como as pessoas compram o que você vende? (Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense em como as pessoas vão comprar daqui a alguns anos. Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras."
 },
 {
  "codigo": "P08",
  "pergunta": "Nos próximos anos, o que você acha que vai mudar na forma como as pessoas compram o que você vende? (Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Quais mudanças (tecnologia, jeito de comprar, regras) podem afetar quem vende [produto ou serviço] nos próximos anos? Explique de forma simples e diga o que é suposição.\" Confirme em fontes confiáveis, como o portal do Sebrae."
 },
 {
  "codigo": "P09",
  "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?",
  "opcao": "No meu bairro e na minha cidade",
  "tipo": "Dica",
  "texto": "Seu foco é perto de você. Os concorrentes mais próximos tendem a ser os da mesma cidade."
 },
 {
  "codigo": "P09",
  "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?",
  "opcao": "Na minha região (estado e cidades próximas)",
  "tipo": "Dica",
  "texto": "Você pretende atender várias cidades. Pense em como a entrega ou o atendimento vai chegar até elas."
 },
 {
  "codigo": "P09",
  "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?",
  "opcao": "No Brasil todo",
  "tipo": "Dica",
  "texto": "Vender para o país todo costuma exigir pensar em frete, prazo de entrega e venda pela internet."
 },
 {
  "codigo": "P09",
  "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?",
  "opcao": "Também fora do Brasil",
  "tipo": "Dica",
  "texto": "Vender para fora costuma ter regras próprias, como documentos e impostos. Vale pesquisar antes."
 },
 {
  "codigo": "P10",
  "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?",
  "opcao": "Pessoas comuns (consumidor final)",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P10",
  "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?",
  "opcao": "Empresas",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P10",
  "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?",
  "opcao": "Campos complementares incompletos",
  "tipo": "Dica",
  "texto": "Preencha o que você já sabe. O que ficar de fora dá para completar depois."
 },
 {
  "codigo": "P10",
  "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Me ajude a descrever quem seria o meu cliente ideal: idade, renda, profissão, onde mora e o que ele precisa resolver.\""
 },
 {
  "codigo": "P11",
  "pergunta": "Que problema ou vontade do seu cliente você resolve? (Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P11",
  "pergunta": "Que problema ou vontade do seu cliente você resolve? (Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense no problema ou na vontade do cliente. Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa."
 },
 {
  "codigo": "P11",
  "pergunta": "Que problema ou vontade do seu cliente você resolve? (Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço]. Que problemas ou vontades do cliente isso resolve? Dê exemplos do dia a dia, em linguagem simples.\" Pergunte a clientes se isso faz sentido para eles."
 },
 {
  "codigo": "P12",
  "pergunta": "Seria difícil para outra pessoa abrir um negócio igual ao seu e vender como você? O que dificulta? (Ex.: precisa de muito dinheiro, de licença, de máquina cara, ou o seu nome já é conhecido)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P12",
  "pergunta": "Seria difícil para outra pessoa abrir um negócio igual ao seu e vender como você? O que dificulta? (Ex.: precisa de muito dinheiro, de licença, de máquina cara, ou o seu nome já é conhecido)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense no que dificulta outra pessoa de começar igual a você. Ex.: muito dinheiro, licença, máquina cara, nome já conhecido."
 },
 {
  "codigo": "P12",
  "pergunta": "Seria difícil para outra pessoa abrir um negócio igual ao seu e vender como você? O que dificulta? (Ex.: precisa de muito dinheiro, de licença, de máquina cara, ou o seu nome já é conhecido)",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Quais são as dificuldades comuns para alguém abrir um negócio de [produto ou serviço]? Explique de forma simples.\""
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Loja física",
  "tipo": "Dica",
  "texto": "Considere loja, feira, ponto de atendimento ou venda direta."
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Marketplace (ex.: Mercado Livre, Shopee)",
  "tipo": "Dica",
  "texto": "Considere plataformas onde o cliente procura e compra de vários vendedores."
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Redes sociais (Instagram, Facebook, WhatsApp)",
  "tipo": "Dica",
  "texto": "Considere vender e atender por Instagram, Facebook ou WhatsApp."
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Site ou aplicativo próprio",
  "tipo": "Dica",
  "texto": "Considere se o cliente consegue achar e comprar sem falar com você."
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Outro",
  "tipo": "Dica",
  "texto": "Escreva onde mais o cliente encontra e compra de você."
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço]. Quais são os melhores canais para vender isso (loja, WhatsApp, Instagram, marketplace, site)? Explique as vantagens de cada um.\""
 },
 {
  "codigo": "P13",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?",
  "opcao": "Nenhuma opção marcada",
  "tipo": "Alerta",
  "texto": "Marque pelo menos um canal ou escolha 'Não sei'."
 },
 {
  "codigo": "P14",
  "pergunta": "O que o seu negócio faz de melhor hoje? E o que ainda precisa melhorar?",
  "opcao": "Preencheu os dois campos",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P14",
  "pergunta": "O que o seu negócio faz de melhor hoje? E o que ainda precisa melhorar?",
  "opcao": "Preencheu só um dos campos",
  "tipo": "Dica",
  "texto": "Todo negócio tem pontos fortes e pontos a melhorar. Tente escrever pelo menos um de cada."
 },
 {
  "codigo": "P14",
  "pergunta": "O que o seu negócio faz de melhor hoje? E o que ainda precisa melhorar?",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Pense no que os clientes elogiam e no que costumam reclamar."
 },
 {
  "codigo": "P15",
  "pergunta": "Quem vende o mesmo que você ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece.",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P15",
  "pergunta": "Quem vende o mesmo que você ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece.",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Cite lojas, pessoas ou perfis que vendem o mesmo que você ou algo muito parecido."
 },
 {
  "codigo": "P15",
  "pergunta": "Quem vende o mesmo que você ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece.",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço] em [cidade ou bairro]. Me explique como encontrar quem vende o mesmo, só com o celular. Não invente nomes de lojas.\" Confirme cada nome encontrado no Google Maps ou no Instagram."
 },
 {
  "codigo": "P16",
  "pergunta": "Para você, quem é \"concorrente de verdade\"? O que essa pessoa ou loja tem que ter para tirar cliente de você?",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P16",
  "pergunta": "Para você, quem é \"concorrente de verdade\"? O que essa pessoa ou loja tem que ter para tirar cliente de você?",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense no que faz alguém tirar cliente de você. Ex.: vende o mesmo produto, para o mesmo público, na mesma região."
 },
 {
  "codigo": "P16",
  "pergunta": "Para você, quem é \"concorrente de verdade\"? O que essa pessoa ou loja tem que ter para tirar cliente de você?",
  "opcao": "Não sei",
  "tipo": "Prompt de IA",
  "texto": "Prompt: \"Eu vendo [produto ou serviço] para [tipo de cliente]. O que faz alguém ser meu concorrente de verdade? Dê exemplos simples, como mesmo produto, mesmo público e mesma região.\""
 },
 {
  "codigo": "P17",
  "pergunta": "Você sabe como descobrir quem vende o mesmo que você? (Ex.: procurar no Google Maps, no Instagram ou perguntando aos clientes)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P17",
  "pergunta": "Você sabe como descobrir quem vende o mesmo que você? (Ex.: procurar no Google Maps, no Instagram ou perguntando aos clientes)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Conte como você encontra quem vende igual. Ex.: busca no Google Maps, Instagram ou conversa com clientes."
 },
 {
  "codigo": "P17",
  "pergunta": "Você sabe como descobrir quem vende o mesmo que você? (Ex.: procurar no Google Maps, no Instagram ou perguntando aos clientes)",
  "opcao": "Não sei",
  "tipo": "Passo a passo",
  "texto": "1. Abra o Google Maps e busque o que você vende (ex.: \"bolos perto de mim\"). 2. No Instagram, busque palavras do seu ramo e o nome da sua cidade. 3. Veja se há anúncios no Mercado Livre, Shopee ou OLX. 4. Pergunte a clientes onde mais já compraram. 5. Anote os nomes que mais aparecem."
 },
 {
  "codigo": "P18",
  "pergunta": "Você sabe onde esses concorrentes ficam e como eles trabalham na sua região? (Horário, entrega, forma de atender)",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P18",
  "pergunta": "Você sabe onde esses concorrentes ficam e como eles trabalham na sua região? (Horário, entrega, forma de atender)",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Conte onde ficam e como trabalham. Ex.: horário, entrega, forma de atender."
 },
 {
  "codigo": "P18",
  "pergunta": "Você sabe onde esses concorrentes ficam e como eles trabalham na sua região? (Horário, entrega, forma de atender)",
  "opcao": "Não sei",
  "tipo": "Passo a passo",
  "texto": "1. Busque o nome do concorrente ou o que ele vende no Google Maps. 2. Veja endereço, horário, fotos e avaliações. 3. Veja no Instagram ou WhatsApp como ele atende e entrega. 4. Anote tudo na tabela de concorrentes."
 },
 {
  "codigo": "P19",
  "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo.",
  "opcao": "Sei comparar (texto livre)",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P19",
  "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo.",
  "opcao": "Resposta vazia ou muito curta",
  "tipo": "Dica",
  "texto": "Pense em preço, qualidade, atendimento e prazo. Em qual deles você se sai melhor ou pior?"
 },
 {
  "codigo": "P19",
  "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo.",
  "opcao": "Não sei (tabela guiada)",
  "tipo": "Dica",
  "texto": "Compare o seu negócio com os outros em cada item. Se não souber algum, deixe em branco e volte depois."
 },
 {
  "codigo": "P19",
  "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo.",
  "opcao": "Marcou 'Pior' em 3 ou mais critérios",
  "tipo": "Resposta",
  "texto": "Em vários pontos os outros parecem estar à frente. Vale investigar onde você pode se destacar."
 },
 {
  "codigo": "P20",
  "pergunta": "Quanto os outros costumam cobrar por algo parecido com o que você vende?",
  "opcao": "Informou valores",
  "tipo": "Resposta",
  "texto": "Os outros costumam cobrar em torno de R$ [valor]. Compare com o seu preço."
 },
 {
  "codigo": "P20",
  "pergunta": "Quanto os outros costumam cobrar por algo parecido com o que você vende?",
  "opcao": "Texto sem valor em reais",
  "tipo": "Dica",
  "texto": "Escreva os valores em reais. Ex.: de R$ 40 a R$ 60."
 },
 {
  "codigo": "P20",
  "pergunta": "Quanto os outros costumam cobrar por algo parecido com o que você vende?",
  "opcao": "Não sei",
  "tipo": "Passo a passo",
  "texto": "1. Escolha 3 concorrentes. 2. Veja o preço de algo parecido com o seu no Instagram, no WhatsApp (peça um orçamento) ou nos marketplaces. 3. Anote os valores. 4. Some os preços e divida por 3 para ter o preço médio."
 },
 {
  "codigo": "P21",
  "pergunta": "O que o seu cliente ganha comprando com você e não com o vizinho?",
  "opcao": "Resposta preenchida",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P21",
  "pergunta": "O que o seu cliente ganha comprando com você e não com o vizinho?",
  "opcao": "Resposta muito genérica",
  "tipo": "Dica",
  "texto": "Tente dizer o que o cliente ganha de verdade. Ex.: entrega no mesmo dia, bolo sob medida, atendimento pelo WhatsApp."
 },
 {
  "codigo": "P21",
  "pergunta": "O que o seu cliente ganha comprando com você e não com o vizinho?",
  "opcao": "Não sei",
  "tipo": "Dica",
  "texto": "Pense no que os clientes elogiam em você. Volte aqui depois de se comparar com os outros e ver o que eles fazem bem e onde deixam a desejar."
 },
 {
  "codigo": "P22",
  "pergunta": "O que os outros fazem bem e atraem clientes? E onde eles deixam a desejar? (Ex.: demoram para responder, entrega atrasada, preço alto)",
  "opcao": "Preencheu os dois campos",
  "tipo": "Nenhum",
  "texto": "—"
 },
 {
  "codigo": "P22",
  "pergunta": "O que os outros fazem bem e atraem clientes? E onde eles deixam a desejar? (Ex.: demoram para responder, entrega atrasada, preço alto)",
  "opcao": "Preencheu só um dos campos",
  "tipo": "Dica",
  "texto": "Tente escrever pelo menos um ponto forte e uma falha dos outros. Ex.: demoram para responder, entrega atrasada."
 },
 {
  "codigo": "P22",
  "pergunta": "O que os outros fazem bem e atraem clientes? E onde eles deixam a desejar? (Ex.: demoram para responder, entrega atrasada, preço alto)",
  "opcao": "Não sei",
  "tipo": "Passo a passo",
  "texto": "1. No Google Maps, leia avaliações de 5 estrelas e de 1 ou 2 estrelas. 2. No Instagram, leia os comentários. 3. Anote os elogios e as reclamações que mais se repetem."
 }
];
/* Aba "Perguntas reescritas": bloco e nova pergunta, na ordem */
const PERGUNTAS = [
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Com suas palavras, em que ramo você trabalha e o que você vende? (Ex.: \"Vendo marmitas para trabalhadores do bairro\")"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Você está procurando novas formas de vender mais ou de crescer agora?"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Se o seu cliente não comprar de você, o que ele pode comprar no lugar? (Ex.: quem vende bolo caseiro perde cliente para a padaria ou para o bolo de pote)"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Você viu alguma novidade ou mudança recente que pode ajudar você a vender mais? (Ex.: mais gente comprando pelo WhatsApp, uma obra ou um evento novo perto de você)"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Por que você acredita que essa ideia pode dar certo no seu negócio?"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "O que você já tem e o que ainda falta para colocar essa ideia em prática? (Ex.: dinheiro, equipamento, tempo, ajuda)"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Existe alguma coisa que pode atrapalhar suas vendas? (Ex.: concorrente novo, preço dos insumos subindo, mudança de regra)"
 },
 {
  "bloco": "Bloco 1: Oportunidades do Negócio",
  "pergunta": "Nos próximos anos, o que você acha que vai mudar na forma como as pessoas compram o que você vende? (Ex.: mais pedidos pelo celular, pagamento por Pix, novas regras)"
 },
 {
  "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
  "pergunta": "Até onde você vende hoje? No seu bairro ou cidade, na sua região, no Brasil todo ou até fora do país?"
 },
 {
  "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
  "pergunta": "Quem mais compra de você (ou quem você gostaria que comprasse)? São pessoas comuns ou empresas?"
 },
 {
  "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
  "pergunta": "Que problema ou vontade do seu cliente você resolve? (Ex.: falta de tempo para cozinhar, vontade de ficar bonita para uma festa)"
 },
 {
  "bloco": "Bloco 2: Entender o Mercado e seus Clientes",
  "pergunta": "Seria difícil para outra pessoa abrir um negócio igual ao seu e vender como você? O que dificulta? (Ex.: precisa de muito dinheiro, de licença, de máquina cara, ou o seu nome já é conhecido)"
 },
 {
  "bloco": "Bloco 3: Onde está o Negócio",
  "pergunta": "Onde o seu cliente encontra você e compra de você hoje? Na loja, no WhatsApp, no Instagram, em site ou aplicativo?"
 },
 {
  "bloco": "Bloco 3: Onde está o Negócio",
  "pergunta": "O que o seu negócio faz de melhor hoje? E o que ainda precisa melhorar?"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Quem vende o mesmo que você ou algo muito parecido? Cite lojas, pessoas ou perfis que você conhece."
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Para você, quem é \"concorrente de verdade\"? O que essa pessoa ou loja tem que ter para tirar cliente de você?"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Você sabe como descobrir quem vende o mesmo que você? (Ex.: procurar no Google Maps, no Instagram ou perguntando aos clientes)"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Você sabe onde esses concorrentes ficam e como eles trabalham na sua região? (Horário, entrega, forma de atender)"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Se você colocar o seu negócio ao lado dos outros, como você se sai? Pense em preço, qualidade, atendimento e prazo."
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "Quanto os outros costumam cobrar por algo parecido com o que você vende?"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "O que o seu cliente ganha comprando com você e não com o vizinho?"
 },
 {
  "bloco": "Bloco 4: Definição da Concorrência",
  "pergunta": "O que os outros fazem bem e atraem clientes? E onde eles deixam a desejar? (Ex.: demoram para responder, entrega atrasada, preço alto)"
 }
];

const falhas = [];
let ok = 0;
function check(cond, nome) { if (cond) ok++; else { falhas.push(nome); console.log('FALHA:', nome); } }
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const P = (n) => PERGUNTAS[n - 1];
const TEXTO_OK = 'Resposta de teste com bastante detalhe';
/* concorrentes: 15+16 e 17+18 dividem a mesma tela */
const PAR = { 15: 16, 16: 15, 17: 18, 18: 17 };
const COD = (n) => 'M3.P' + String(n).padStart(2, '0');
/* próxima tela depois de responder a pergunta n (sem herança; dor em branco) */
const ALVO = (n) => (n === 22 ? null : { 15: 17, 16: 17, 17: 19, 18: 19 }[n] || n + 1);
const DOR = 'O que precisa resolver (a dor)';

/* texto esperado na tela para cada tipo de retorno (formatação definida pelas regras técnicas) */
function esperado(l, valor) {
  let g = l.texto;
  if (valor) g = g.replace('[valor]', valor);
  if (l.tipo === 'Prompt de IA') return norm(g.replace(/Prompt:\s*"/, '').replace(/"/g, ''));
  if (l.tipo === 'Passo a passo') return norm(g.replace(/(^|\s)\d+\.\s+/g, ' '));
  return norm(g);
}

(async () => {
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${servidor.address().port}/index.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL.replace('/index.html', '') });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('dialog', (d) => d.accept());

  const clicar = (sel, txt) => page.evaluate(([s, t]) => {
    const n = [...document.querySelectorAll(s)].find((x) => x.textContent.replace(/\s+/g, ' ').trim() === t);
    if (!n) return false; n.click(); return true;
  }, [sel, txt]);
  const espera = (ms = 120) => page.waitForTimeout(ms);
  const titulo = () => page.evaluate(() => (document.querySelector('h2.q') || {}).textContent || '');
  const titulos = () => page.evaluate(() => [...document.querySelectorAll('h2.q')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  const tela = () => page.evaluate(() => document.body.innerText);
  async function semCodigos(onde) {
    const t = await tela();
    check(!/\bP\d{2}\b|M3\.|rafael/i.test(t), `sem códigos/nome na tela (${onde})`);
  }
  async function fonte16(onde) {
    const pequenos = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => {
      const temTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const r = e.getBoundingClientRect();
      return temTexto && r.width > 0 && r.height > 0 && parseFloat(getComputedStyle(e).fontSize) < 16;
    }).map((e) => e.tagName + '.' + e.className));
    check(!pequenos.length, `letra >= 16px (${onde}) ${pequenos.slice(0, 3).join(',')}`);
  }
  async function caixas(escopo = '') {
    return page.evaluate((escopo) => [...document.querySelectorAll(escopo + '.caminho')].map((b) => {
      const c = b.cloneNode(true);
      c.querySelector('b').remove();
      c.querySelectorAll('.btn-copiar').forEach((x) => x.remove());
      return { op: b.dataset.op, tipo: b.dataset.tipo, txt: c.innerText.replace(/\s+/g, ' ').trim(),
        li: [...b.querySelectorAll('li')].map((x) => x.textContent.trim()) };
    }), escopo);
  }
  const textoCaixa = (c) => (c.li.length ? norm(c.li.join(' ')) : norm(c.txt));
  async function shot(nome) { if (!SHOTS) return; await espera(400); fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, nome + '.png'), fullPage: false }); }

  /* abre a pergunta n com respostas anteriores (só P02 muda a visibilidade) */
  async function abrir(n, R = {}, m1 = null, txt = null) {
    const base = n >= 3 && n <= 8 ? { 'M3.P02': { estado: 'opcao', opcao: 'Sim' } } : {};
    const cod = COD(n);
    await page.goto(URL);
    await page.evaluate(([k, s, m1]) => { localStorage.clear(); localStorage.setItem(k, s); if (m1) localStorage.setItem('lg2-turma-a-m01', m1); },
      [CHAVE, JSON.stringify({ v: 4, R: Object.assign(base, R), hist: [cod] }), m1 && JSON.stringify(m1)]);
    await page.reload();
    await clicar('button', 'Continuar de onde parei');
    await espera();
    check((await titulos()).includes(norm(txt || P(n).pergunta)), `abre pergunta ${n}`);
  }
  /* perfil do cliente: toca a 1ª opção de cada grupo de marcadores e escreve nos campos livres */
  async function perfil(livres) {
    await page.evaluate(() => document.querySelectorAll('.campos .marcar').forEach((g) => g.querySelector('.chip').click()));
    const n = await page.locator('.campos input').count();
    for (let i = 0; i < n; i++) await page.locator('.campos input').nth(i).fill(livres[i] || '');
  }
  async function digitar(txt, i = 0) { await page.locator('#ent textarea, #ent input').nth(i).fill(txt); }
  async function preencherCampos(vals) {
    const n = await page.locator('.campos input, #ent textarea').count();
    for (let i = 0; i < n; i++) await page.locator('.campos input, #ent textarea').nth(i).fill(vals[i] || '');
  }

  /* ============ 1. cada linha da aba "Caminhos por resposta" ============ */
  const CURTO = 'pouco';
  for (const l of LINHAS) {
    const n = parseInt(l.codigo.slice(1), 10);
    const nome = `${l.codigo} "${l.opcao}"`;
    check(norm(l.pergunta) === norm(P(n).pergunta), `${nome}: pergunta da aba 2 = aba 1`);
    await abrir(n);
    let avancaSem = false, valor = null, alvoTela = ALVO(n);
    const D = l.opcao;
    /* tela com duas perguntas: escopo da pergunta testada; a outra recebe um texto completo */
    const esc = PAR[n] ? `.pergunta[data-cod="${COD(n)}"] ` : '';
    const outra = () => PAR[n] ? page.locator(`.pergunta[data-cod="${COD(PAR[n])}"] textarea`).fill(TEXTO_OK) : null;
    if (PAR[n]) {
      check(JSON.stringify(await titulos()) === JSON.stringify([n, PAR[n]].sort((a, b) => a - b).map((k) => norm(P(k).pergunta))), `${nome}: duas perguntas na mesma tela`);
      if (/^Não sei/.test(D)) check(await clicar(esc + '.ns', 'Não sei'), `${nome}: botão Não sei`);
      else if (D === 'Resposta vazia ou muito curta') { await page.locator(esc + 'textarea').fill(CURTO); await outra(); await clicar('#ok', 'Continuar'); }
      else { await page.locator(esc + 'textarea').fill(TEXTO_OK); await outra(); avancaSem = true; await clicar('#ok', 'Continuar'); }
    }
    else if (D === 'Não sei' && n === 13) { await clicar('.opcao', 'Não sei'); }
    else if (/^Não sei/.test(D)) { check(await clicar('#ns', 'Não sei'), `${nome}: botão Não sei`); }
    else if (D === 'Resposta vazia ou muito curta') { await digitar(CURTO); await clicar('#ok', 'Continuar'); }
    else if (D === 'Resposta muito genérica') { await digitar('qualidade e bom atendimento'); await clicar('#ok', 'Continuar'); }
    else if (D === 'Texto sem valor em reais') { await digitar('Cobram mais ou menos o mesmo que eu'); await clicar('#ok', 'Continuar'); }
    else if (D === 'Informou valores') { await digitar('Menor R$ 40, médio R$ 55 e maior R$ 70,50'); valor = '55,17'; await clicar('#ok', 'Continuar'); }
    else if (D === 'Preencheu os dois campos') { await digitar(TEXTO_OK, 0); await digitar(TEXTO_OK, 1); avancaSem = true; await clicar('#ok', 'Continuar'); }
    else if (D === 'Preencheu só um dos campos') { await digitar(TEXTO_OK, 0); await clicar('#ok', 'Continuar'); }
    else if (D === 'Campos complementares incompletos') { await clicar('.opcao', 'Empresas'); await espera(); await clicar('.chip', 'Comércio (lojas, mercados)'); await clicar('#ok', 'Continuar'); }
    else if (n === 10) {
      await clicar('.opcao', D); await espera(); await perfil(['Centro', 'Lavar o carro sem sair de casa']); avancaSem = true;
      /* a dor escrita no perfil responde a pergunta seguinte (que é pulada) */
      if (D === 'Pessoas comuns (consumidor final)') alvoTela = 12;
      await clicar('#ok', 'Continuar');
    }
    else if (D === 'Nenhuma opção marcada') { await clicar('#ok', 'Continuar'); }
    else if (D === "Marcou 'Pior' em 3 ou mais critérios") {
      await clicar('#ns', 'Não sei');
      for (const c of ['Preço', 'Qualidade', 'Atendimento']) await page.evaluate((c) => [...document.querySelectorAll('.t-linha')].find((x) => x.dataset.crit === c).querySelectorAll('.t-op')[2].click(), c);
    }
    else if (n === 2 || n === 9 || n === 13) { await clicar('.opcao', D); if (n === 2) { avancaSem = true; } }
    else if (D === 'Resposta preenchida' && n === 21) { await digitar('Entrega no mesmo dia e bolo sob medida'); avancaSem = true; await clicar('#ok', 'Continuar'); }
    else { await digitar(TEXTO_OK); avancaSem = l.tipo === 'Nenhum'; await clicar('#ok', 'Continuar'); }
    await espera();
    const cx = await caixas(esc);
    if (l.tipo === 'Nenhum') {
      check(cx.length === 0, `${nome}: Nenhum = sem mensagem (${cx.map((c) => c.op).join('|')})`);
      if (n === 2) {
        await clicar('#ok', 'Continuar'); await espera();
        const alvo = D === 'Sim' ? 3 : 9;
        check(norm(await titulo()) === norm(P(alvo).pergunta), `${nome}: segue para a pergunta ${alvo}`);
      } else if (avancaSem) {
        const alvo = alvoTela;
        if (alvo) check(norm(await titulo()) === norm(P(alvo).pergunta), `${nome}: salva e segue para a pergunta ${alvo}`);
        else check(await page.evaluate(() => !!document.querySelector('.res-bloco')), `${nome}: conclui e mostra o resumo`);
      }
      continue;
    }
    const alvoCaixa = cx.filter((c) => c.op === l.opcao);
    const esperadoOps = D === "Marcou 'Pior' em 3 ou mais critérios" ? ['Não sei (tabela guiada)', D]
      : D === 'Campos complementares incompletos' ? [D] : [D];
    check(JSON.stringify(cx.map((c) => c.op).sort()) === JSON.stringify(esperadoOps.slice().sort()), `${nome}: conjunto exato de mensagens (${cx.map((c) => c.op).join('|')})`);
    check(alvoCaixa.length === 1 && alvoCaixa[0].tipo === l.tipo, `${nome}: tipo ${l.tipo}`);
    if (alvoCaixa[0]) check(textoCaixa(alvoCaixa[0]) === esperado(l, valor), `${nome}: texto literal\n   tela: ${textoCaixa(alvoCaixa[0])}\n   plan: ${esperado(l, valor)}`);
    if (l.tipo === 'Alerta') {
      check(norm(await titulo()) === norm(P(n).pergunta), `${nome}: Alerta bloqueia o avanço`);
      const R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
      check(!R['M3.P13'], `${nome}: nada gravado com o Alerta`);
    }
    if (['Resposta vazia ou muito curta', 'Resposta muito genérica', 'Texto sem valor em reais', 'Preencheu só um dos campos', 'Campos complementares incompletos'].includes(D)) {
      check(await clicar('#ok', 'Continuar mesmo assim'), `${nome}: não bloqueia (Continuar mesmo assim)`);
      await espera();
      const alvo = alvoTela;
      if (alvo) check(norm(await titulo()) === norm(P(alvo).pergunta), `${nome}: segue para a pergunta ${alvo}`);
      else check(await page.evaluate(() => !!document.querySelector('.res-bloco')), `${nome}: conclui e mostra o resumo`);
    }
    if (/^Não sei/.test(D) || D.startsWith('Marcou')) {
      const R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
      const cod = 'M3.' + l.codigo;
      if (n !== 13) check(R[cod] && R[cod].estado === 'naosei', `${nome}: fica pendente`);
      if (n !== 13) {
        if (PAR[n]) { await outra(); check(await clicar('#ok', 'Continuar'), `${nome}: Não sei não bloqueia`); }
        else check(await clicar('#ok', 'Seguir'), `${nome}: Não sei não bloqueia`);
        await espera();
        const alvo = alvoTela;
        if (alvo) check(norm(await titulo()) === norm(P(alvo).pergunta), `${nome}: segue para a pergunta ${alvo}`);
        else check(await page.evaluate(() => !!document.querySelector('.res-bloco')), `${nome}: conclui e mostra o resumo`);
      }
    }
    await semCodigos(nome);
  }

  /* ============ 2. prompts copiáveis ============ */
  await abrir(4);
  await clicar('#ns', 'Não sei'); await espera();
  await shot('02-pergunta-texto-nao-sei-prompt');
  await fonte16('pergunta com prompt');
  const btn = page.locator('.btn-copiar').first();
  await btn.click(); await espera(300);
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  const l04 = LINHAS.find((l) => l.codigo === 'P04' && l.opcao === 'Não sei');
  check(copiado === l04.texto.match(/Prompt:\s*"([^"]*)"/)[1] && /\[cidade ou bairro\]/.test(copiado), 'prompt copiado com [colchetes]');
  check(norm(await btn.textContent()) === 'Copiado', 'botão mostra Copiado');
  check(await page.evaluate(() => !!document.querySelector('.b-ia .conferir')), 'prompt vem junto da instrução de conferir');

  /* P01 Não sei: frase só é salva quando a pessoa confirma */
  await abrir(1);
  await clicar('#ns', 'Não sei'); await espera();
  await page.locator('.frase textarea').fill('Eu vendo marmitas no bairro');
  let R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(!R['M3.P01'].frase, 'P01: frase não salva sem confirmar');
  await clicar('#salvar-frase', 'Salvar a frase'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(R['M3.P01'].frase === 'Eu vendo marmitas no bairro', 'P01: frase salva após confirmar');

  /* P06 preenchida: salva e mostra o prompt de análise */
  await abrir(6);
  await digitar('Tenho fogão e tempo, falta dinheiro'); await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(R['M3.P06'] && R['M3.P06'].valor === 'Tenho fogão e tempo, falta dinheiro', 'P06: texto salvo antes do prompt');

  /* P07 e P12 Não sei: exemplos para marcar, salvos */
  for (const [n, ex] of [[7, 'mudança de regra'], [12, 'clientes fiéis']]) {
    await abrir(n);
    await clicar('#ns', 'Não sei'); await espera();
    check(await clicar('.chip', ex), `pergunta ${n}: exemplo "${ex}" para marcar`);
    await espera();
    R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
    const cod = 'M3.P' + String(n).padStart(2, '0');
    check(R[cod].estado === 'naosei' && R[cod].marcados.includes(ex), `pergunta ${n}: marcado salvo`);
  }
  const nChips = await page.locator('.chip').count();
  check(nChips === 5, 'pergunta 12: 5 exemplos');

  /* ============ 3. P10 campos das duas escolhas ============ */
  await abrir(10);
  await clicar('#ok', 'Continuar'); await espera();
  check(norm(await titulo()) === norm(P(10).pergunta) && await page.evaluate(() => !document.querySelector('#erro').hidden), 'P10 exige escolha (ou Não sei)');
  await clicar('.opcao', 'Pessoas comuns (consumidor final)'); await espera();
  const rotPF = await page.evaluate(() => [...document.querySelectorAll('.campos .item span')].map((s) => s.textContent));
  check(JSON.stringify(rotPF) === JSON.stringify(['Idade', 'Renda', 'Ocupação', 'Onde mora', 'O que precisa resolver (a dor)']), 'P10 Pessoas comuns: 5 campos');
  /* marcadores em todos os campos, menos "Onde mora" e a dor (texto livre) */
  const gruposPF = await page.evaluate(() => [...document.querySelectorAll('.campos .item-marcar')].map((g) => [g.dataset.c, [...g.querySelectorAll('.chip')].map((c) => c.textContent)]));
  const MARC = await page.evaluate(() => window.MODULO3.perguntas.find((q) => q.codigo === 'M3.P10').marcadores);
  check(JSON.stringify(gruposPF.map((g) => g[0])) === '["Idade","Renda","Ocupação"]', 'P10 Pessoas comuns: marcadores em Idade, Renda e Ocupação');
  check(gruposPF.every((g) => g[1].length >= 5 && g[1][g[1].length - 1] === 'Não sei' && JSON.stringify(g[1]) === JSON.stringify(MARC[g[0]])), 'P10: cada grupo com opções + "Não sei"');
  const livresPF = await page.evaluate(() => [...document.querySelectorAll('.campos input')].map((i) => i.dataset.c));
  check(JSON.stringify(livresPF) === '["Onde mora","O que precisa resolver (a dor)"]', 'P10 Pessoas comuns: texto livre só em Onde mora e na dor');
  await clicar('.chip', '18 a 29 anos'); await clicar('.chip', '30 a 44 anos');
  await clicar('.chip', 'De 1 a 3 salários mínimos');
  await clicar('.chip', 'Estudantes'); await clicar('.item-marcar[data-c="Ocupação"] .chip', 'Não sei');
  const ocup = await page.evaluate(() => [...document.querySelector('.item-marcar[data-c="Ocupação"]').querySelectorAll('.chip.sel')].map((c) => c.textContent));
  check(JSON.stringify(ocup) === '["Não sei"]', 'P10: "Não sei" do marcador é exclusivo');
  await page.locator('.campos input').nth(0).fill('Centro');
  await page.locator('.campos input').nth(1).fill('Lavar o carro sem sair de casa');
  await shot('03-p10-pessoas-comuns');
  await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(JSON.stringify(R['M3.P10'].campos) === JSON.stringify({ Idade: '18 a 29 anos; 30 a 44 anos', Renda: 'De 1 a 3 salários mínimos', 'Ocupação': 'Não sei', 'Onde mora': 'Centro', [DOR]: 'Lavar o carro sem sair de casa' }), 'P10 Pessoas comuns: marcadores salvos como texto');
  check(R['M3.P11'] && R['M3.P11'].valor === 'Lavar o carro sem sair de casa' && R['M3.P11'].doPerfil, 'P10 dor: vira a resposta da pergunta seguinte');
  check(norm(await titulo()) === norm(P(12).pergunta), 'P10 com a dor escrita: pula a pergunta repetida (vai para a 12)');
  /* voltar ao perfil mostra as marcas */
  await clicar('#v', '‹ voltar'); await espera();
  check(norm(await titulo()) === norm(P(10).pergunta), 'voltar da 12 abre o perfil (a 11 foi pulada)');
  const selVolta = await page.evaluate(() => [...document.querySelectorAll('.campos .chip.sel')].map((c) => c.textContent));
  check(JSON.stringify(selVolta) === '["18 a 29 anos","30 a 44 anos","De 1 a 3 salários mínimos","Não sei"]', 'P10: marcas voltam ao reabrir');
  await clicar('.opcao', 'Empresas'); await espera();
  const rotPJ = await page.evaluate(() => [...document.querySelectorAll('.campos .item span')].map((s) => s.textContent));
  check(JSON.stringify(rotPJ) === JSON.stringify(['Ramo', 'Tamanho', 'Equipe', 'Local']), 'P10 Empresas: 4 campos');
  const gruposPJ = await page.evaluate(() => [...document.querySelectorAll('.campos .item-marcar')].map((g) => g.dataset.c));
  check(JSON.stringify(gruposPJ) === '["Ramo","Tamanho","Equipe"]', 'P10 Empresas: marcadores em Ramo, Tamanho e Equipe; Local é livre');
  await clicar('.chip', 'Restaurantes e alimentação'); await clicar('.chip', 'Micro ou pequena empresa'); await clicar('.chip', '2 a 9 pessoas');
  await page.locator('.campos input').nth(0).fill('Juiz de Fora');
  await shot('03b-p10-empresas');
  await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(R['M3.P10'].opcao === 'Empresas' && R['M3.P10'].campos.Equipe === '2 a 9 pessoas', 'P10 Empresas: campos salvos');
  check(!R['M3.P11'], 'P10 Empresas: a dor copiada do perfil anterior sai');
  check(norm(await titulo()) === norm(P(11).pergunta), 'P10 Empresas (sem dor) segue para a 11');

  /* ============ 4. P13 seleção múltipla ============ */
  await abrir(13);
  await clicar('#ok', 'Continuar'); await espera();
  check(norm(await titulo()) === norm(P(13).pergunta), 'P13: nenhum marcado bloqueia');
  await clicar('.opcao', 'Loja física'); await clicar('.opcao', 'Redes sociais (Instagram, Facebook, WhatsApp)'); await clicar('.opcao', 'Outro'); await espera();
  check(await page.locator('.extra textarea').isVisible(), 'P13: Outro abre campo livre');
  await page.locator('.extra textarea').fill('Feira de domingo');
  check((await caixas()).length === 3, 'P13: uma dica por canal marcado');
  await shot('04-p13-multipla');
  await clicar('.opcao', 'Não sei'); await espera();
  const opsNS = await page.evaluate(() => [...document.querySelectorAll('.opcao.sel')].map((x) => x.dataset.op));
  check(JSON.stringify(opsNS) === '["Não sei"]', 'P13: Não sei é exclusivo');
  await clicar('.opcao', 'Não sei'); await clicar('.opcao', 'Loja física'); await clicar('.opcao', 'Outro'); await page.locator('.extra textarea').fill('Feira de domingo');
  await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(JSON.stringify(R['M3.P13']) === JSON.stringify({ estado: 'opcoes', opcoes: ['Loja física', 'Outro'], detalhe: 'Feira de domingo' }), 'P13: canais + Outro salvos');

  /* ============ 5. P19 tabela + 3 Pior; P20 média ============ */
  await abrir(19);
  await clicar('#ns', 'Não sei'); await espera();
  const crit = await page.evaluate(() => [...document.querySelectorAll('.t-linha')].map((x) => x.dataset.crit));
  check(JSON.stringify(crit) === JSON.stringify(['Preço', 'Qualidade', 'Atendimento', 'Prazo (tempo para entregar)']), 'P19: 4 critérios');
  const marca = (c, i) => page.evaluate(([c, i]) => [...document.querySelectorAll('.t-linha')].find((x) => x.dataset.crit === c).querySelectorAll('.t-op')[i].click(), [c, i]);
  await marca('Preço', 2); await marca('Qualidade', 2); await espera();
  check(!(await caixas()).some((c) => c.tipo === 'Resposta'), 'P19: 2 Pior sem mensagem');
  await marca('Atendimento', 0); await marca('Prazo (tempo para entregar)', 2); await espera();
  check((await caixas()).some((c) => c.tipo === 'Resposta'), 'P19: 3 Pior mostra a mensagem');
  await page.evaluate(() => document.querySelector('.tabela').scrollIntoView({ block: 'start' }));
  await shot('05-p19-tabela');
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(JSON.stringify(R['M3.P19'].tabela) === JSON.stringify({ 'Preço': 'Pior', Qualidade: 'Pior', Atendimento: 'Melhor', 'Prazo (tempo para entregar)': 'Pior' }), 'P19: marcas salvas');
  await marca('Prazo (tempo para entregar)', 2); await espera();
  check(!(await caixas()).some((c) => c.tipo === 'Resposta'), 'P19: desmarcar volta a 2 Pior');

  for (const [txt, media] of [['de R$ 40 a R$ 60', '50,00'], ['menor 1.200,50 e maior 1.300', '1.250,25'], ['R$ 30', '30,00']]) {
    await abrir(20);
    await digitar(txt); await clicar('#ok', 'Continuar'); await espera();
    const c = (await caixas())[0];
    check(c && c.txt === `Os outros costumam cobrar em torno de R$ ${media}. Compare com o seu preço.`, `P20 média de "${txt}" = R$ ${media}`);
  }

  /* ============ 6. caminhos completos até o resumo ============ */
  async function responderAtual(modo) {
    const t = norm(await titulo());
    const n = PERGUNTAS.findIndex((p) => norm(p.pergunta) === t) + 1;
    if (!n) throw new Error('pergunta desconhecida: ' + t);
    if (PAR[n]) {
      for (const k of [n, PAR[n]]) {
        if (modo.ns && modo.ns.includes(k)) await clicar(`.pergunta[data-cod="${COD(k)}"] .ns`, 'Não sei');
        else await page.locator(`.pergunta[data-cod="${COD(k)}"] textarea`).fill(`Resposta da pergunta ${k} com detalhe`);
      }
      await clicar('#ok', 'Continuar');
    } else if (modo.ns && modo.ns.includes(n)) {
      if (n === 13) { await clicar('.opcao', 'Não sei'); await clicar('#ok', 'Continuar'); await espera(); }
      else await clicar('#ns', 'Não sei');
      await espera(); await clicar('#ok', 'Seguir');
    } else if (n === 2) { await clicar('.opcao', modo.p02); await clicar('#ok', 'Continuar'); }
    else if (n === 9) { await clicar('.opcao', 'No meu bairro e na minha cidade'); await clicar('#ok', 'Continuar'); }
    else if (n === 10) { await clicar('.opcao', 'Pessoas comuns (consumidor final)'); await espera(); await perfil(['Centro', modo.dor === undefined ? 'falta de tempo' : modo.dor]); await clicar('#ok', 'Continuar'); await espera(); await clicar('#ok', 'Continuar mesmo assim'); }
    else if (n === 13) { await clicar('.opcao', 'Loja física'); await clicar('#ok', 'Continuar'); }
    else if (n === 14 || n === 22) { await digitar(TEXTO_OK, 0); await digitar(TEXTO_OK, 1); await clicar('#ok', 'Continuar'); }
    else if (n === 20) { await digitar('de R$ 40 a R$ 60'); await clicar('#ok', 'Continuar'); await espera(); await clicar('#ok', 'Seguir'); }
    else if (n === 21) { await digitar('Entrega no mesmo dia pelo WhatsApp'); await clicar('#ok', 'Continuar'); }
    else if (n === 6) { await digitar(`Resposta da pergunta ${n} com detalhe`); await clicar('#ok', 'Continuar'); await espera(); await clicar('#ok', 'Seguir'); }
    else { await digitar(`Resposta da pergunta ${n} com detalhe`); await clicar('#ok', 'Continuar'); }
    await espera();
    return n;
  }
  async function caminho(modo) {
    await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload();
    await clicar('button', 'Começar'); await espera();
    const vistos = [];
    for (let i = 0; i < 30; i++) {
      if (await page.evaluate(() => !!document.querySelector('.res-bloco'))) break;
      vistos.push(await responderAtual(modo));
      if (i === 3 && modo.recarregar) {
        const antes = norm(await titulo());
        await page.reload(); await espera();
        check(await clicar('button', 'Continuar de onde parei'), 'persistência: capa oferece continuar');
        await espera();
        check(norm(await titulo()) === antes, 'persistência: volta na mesma pergunta após recarregar');
        const R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
        check(Object.keys(R).length === 4, 'persistência: 4 respostas guardadas');
      }
    }
    return vistos;
  }

  /* telas: antes 22; agora 15+16 e 17+18 dividem a tela e a 11 é pulada quando a dor já foi escrita no perfil */
  const vSim0 = await caminho({ p02: 'Sim', dor: '' });
  check(JSON.stringify(vSim0) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22]), `P02 Sim sem dor no perfil: 20 telas (${vSim0.join(',')})`);
  const vSim = await caminho({ p02: 'Sim', ns: [3, 12, 13, 17], recarregar: true });
  check(JSON.stringify(vSim) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 19, 20, 21, 22]), `P02 Sim com a dor no perfil: 19 telas na ordem (${vSim.join(',')})`);
  check(await page.evaluate(() => !!document.querySelector('.res-bloco')), 'P02 Sim: chega ao resumo');
  await semCodigos('resumo');
  await fonte16('resumo');
  const res = await page.evaluate(() => ({
    blocos: [...document.querySelectorAll('.bloco-titulo')].map((x) => x.textContent),
    pend: [...document.querySelectorAll('.pend p')].map((x) => x.textContent),
    hip: [...document.querySelectorAll('.etapa')].filter((e) => e.querySelector('.hip')).map((e) => e.querySelector('.etapa-q').textContent),
    hipTxt: [...new Set([...document.querySelectorAll('.hip')].map((x) => x.textContent))],
    texto: document.body.innerText,
    respostas: document.querySelector('#respostas').textContent,
    fechado: !document.querySelector('#respostas').open,
    entendemos: [...document.querySelectorAll('#entendemos p')].map((x) => x.textContent),
    titEnt: (document.querySelector('#entendemos h2') || {}).textContent,
    ordem: [...document.querySelectorAll('main > *')].map((x) => x.id || x.className),
    logos: [...document.querySelectorAll('.rodape img')].map((i) => i.alt),
    titPend: [...document.querySelectorAll('.pendentes .secao-titulo')].map((x) => x.textContent),
  }));
  check(JSON.stringify(res.blocos) === JSON.stringify([...new Set(PERGUNTAS.map((p) => p.bloco))]), 'resumo: 4 blocos');
  check(JSON.stringify(res.pend) === JSON.stringify([3, 12, 13, 17].map((n) => P(n).pergunta)), 'resumo: pendentes = perguntas com Não sei');
  check(res.titPend[0] === 'Perguntas que você marcou como Não sei', 'resumo: título dos pendentes');
  check(JSON.stringify(res.hip) === JSON.stringify([4, 8, 11, 19].map((n) => P(n).pergunta)) && res.hipTxt.join() === 'hipótese a investigar', 'resumo: hipótese a investigar em 4, 8, 11, 19');
  check(res.respostas.includes('Os outros costumam cobrar em torno de R$ 50,00. Compare com o seu preço.'), 'resumo: mensagem da média');
  check(res.titEnt === 'O que entendemos até aqui' && res.entendemos.length >= 3 && res.entendemos.length <= 6, `resumo: caixa "O que entendemos até aqui" com 3 a 6 frases (${res.entendemos.length})`);
  check(res.ordem.indexOf('entendemos') >= 0 && res.ordem.indexOf('entendemos') < res.ordem.indexOf('respostas'), 'resumo: caixa no topo, respostas depois');
  check(res.fechado && /Ver suas respostas/.test(res.texto), 'resumo: respostas recolhidas em "Ver suas respostas"');
  check(res.entendemos.some((t) => t.includes('R$ 50,00')) && res.entendemos.some((t) => /falta de tempo/.test(t)) && res.entendemos.some((t) => /3 perguntas|4 perguntas/.test(t)), 'resumo: caixa junta preço, dor e pendências');
  const D3 = await page.evaluate(() => window.MODULO3.mapa);
  for (const k of ['entrega', 'encaminhamentos', 'mensagem_limite']) check(norm(res.texto).includes(norm(D3[k])), `resumo: texto do Mapa (${k})`);
  check(res.logos.join() === 'FACC,UFJF,Governo de Minas Gerais', 'rodapé com FACC/UFJF/MG');
  await shot('06-resultado');
  /* voltar e preencher um pendente */
  await clicar('.pend[data-cod="M3.P12"] .preencher', 'Preencher agora'); await espera();
  check(norm(await titulo()) === norm(P(12).pergunta), 'pendente: abre a pergunta');
  await digitar('Precisa de licença e máquina cara'); await clicar('#ok', 'Continuar'); await espera();
  const pend2 = await page.evaluate(() => [...document.querySelectorAll('.pend p')].map((x) => x.textContent));
  check(JSON.stringify(pend2) === JSON.stringify([3, 13, 17].map((n) => P(n).pergunta)), 'pendente preenchido sai da lista e volta ao resumo');

  const vNao = await caminho({ p02: 'Não', ns: [1] });
  check(JSON.stringify(vNao) === JSON.stringify([1, 2, 9, 10, 12, 13, 14, 15, 17, 19, 20, 21, 22]), `P02 Não: pula 3 a 8 (${vNao.join(',')})`);
  const resNao = await page.evaluate(() => [...document.querySelectorAll('.etapa')].length);
  check(resNao === 16, 'P02 Não: resumo com 16 perguntas');
  /* trocar Sim por Não descarta as respostas puladas */
  await abrir(2, { 'M3.P03': { estado: 'valor', valor: 'Padaria do bairro' } });
  await clicar('.opcao', 'Não'); await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(!R['M3.P03'], 'P02 Não: respostas de 3 a 8 descartadas');

  /* ============ 6b. herança do Módulo 1 e versão "o que você imagina" ============ */
  const DADOS = await page.evaluate(() => window.MODULO3.perguntas);
  const VAR = (n, est = 'ideia') => DADOS[n - 1].variantes[est];
  const SO_CABECA = { estado: 'opcao', opcao: 'Ainda está só na minha cabeça' };
  const M1 = (p01, extra = {}) => ({ v: 3, R: Object.assign({ 'M1.P01': p01, 'M1.P03': { estado: 'valor', valor: 'lavagem de carro em casa' },
    'M1.P03A': { estado: 'opcao', opcao: 'Serviço: meu cliente paga pelo trabalho que realizo' } }, extra) });
  /* começa pela pergunta 2: a 1 (ramo e o que vende) veio do Módulo 1 */
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA)));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  check(norm(await titulo()) === norm(VAR(2).pergunta), 'herança: com o Módulo 1, começa pela pergunta 2 (versão de quem ainda não começou)');
  const kick = await page.evaluate(() => document.querySelector('.passo').textContent);
  check(kick === 'Pergunta 1 de 19', `herança: contagem sem a pergunta herdada (${kick})`);
  await semCodigos('herança pergunta 2');
  /* versão "pretende vender" no alcance; a de quem testa e a de quem já vende */
  await abrir(9, {}, M1(SO_CABECA), VAR(9).pergunta);
  check(/^Até onde você pretende vender\?/.test(norm(await titulo())), 'alcance: "Até onde você pretende vender?" para quem ainda não começou');
  await shot('07-alcance-ideia');
  await abrir(9, {}, M1({ estado: 'opcao', opcao: 'Já fiz um pouco para testar ou dar de amostra' }), VAR(9, 'comecando').pergunta);
  check(/^Até onde você vende ou pretende vender\?/.test(norm(await titulo())), 'alcance: versão de quem está testando');
  await abrir(9, {}, M1({ estado: 'opcao', opcao: 'Já vendo sempre' }));
  check(norm(await titulo()) === norm(P(9).pergunta), 'alcance: quem já vende vê o texto original');
  /* image7: "o que o seu negócio faz de melhor hoje" vira "o que você imagina" */
  await abrir(14, {}, M1(SO_CABECA), VAR(14).pergunta);
  const rot14 = await page.evaluate(() => [...document.querySelectorAll('#ent .item span')].map((s) => s.textContent));
  check(JSON.stringify(rot14) === JSON.stringify(Object.values(VAR(14).campos)), 'P14: campos na versão "o que você imagina"');
  check(!/faz de melhor hoje/.test(await tela()), 'P14: nada de "hoje" para quem ainda não começou');
  await clicar('#ns', 'Não sei'); await espera();
  check((await caixas()).some((c) => c.txt === VAR(14).caminhos['Não sei']), 'P14 Não sei: dica na versão de quem ainda não começou');
  await shot('08-p14-ideia');
  await digitar(TEXTO_OK, 0); await digitar(TEXTO_OK, 1); await clicar('#ok', 'Continuar'); await espera();
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(JSON.stringify(Object.keys(R['M3.P14'].campos)) === JSON.stringify(DADOS[13].campos), 'P14: resposta guardada com os mesmos campos de sempre');
  /* prompts: "Eu quero vender" + o que vende */
  await abrir(13, {}, M1(SO_CABECA), VAR(13).pergunta);
  await clicar('.opcao', 'Não sei'); await espera();
  const p13 = (await caixas()).find((c) => c.op === 'Não sei');
  check(p13 && p13.txt.includes('Eu quero vender lavagem de carro em casa.'), 'prompt: "Eu quero vender" + o que vende do Módulo 1');
  await clicar('.opcao', 'Não sei'); await clicar('.opcao', 'Outro'); await espera();
  check((await caixas()).some((c) => c.txt === VAR(13).caminhos.Outro), 'P13 Outro: dica na versão de quem ainda não começou');
  /* todas as perguntas com versão: o enunciado muda e nada fica no presente de quem já vende */
  for (const q of DADOS.filter((q) => q.variantes && q.variantes.ideia && q.codigo !== 'M3.P01')) {
    const n = +q.codigo.slice(4);
    await abrir(n, {}, M1(SO_CABECA), q.variantes.ideia.pergunta);
  }
  check(!DADOS.some((q) => q.variantes && q.variantes.ideia && /\b(vende hoje|faz de melhor hoje|compra de você hoje)\b/.test(q.variantes.ideia.pergunta)), 'versões "o que você imagina" sem "hoje"');
  /* "Não sei" no Módulo 1 não conta como herança */
  await page.goto(URL);
  await page.evaluate((m1) => { localStorage.clear(); localStorage.setItem('lg2-turma-a-m01', m1); }, JSON.stringify(M1(SO_CABECA, { 'M1.P03': { estado: 'naosei' } })));
  await page.reload(); await clicar('button', 'Começar'); await espera();
  check(norm(await titulo()) === norm(VAR(1).pergunta) && (await page.inputValue('#ent textarea')) === '', 'herança: "Não sei" no Módulo 1 não pula a pergunta 1');
  /* resumo: a resposta herdada aparece com o selo e pode ser ajustada */
  const RESP = { 'M3.P02': { estado: 'opcao', opcao: 'Não' }, 'M3.P09': { estado: 'opcao', opcao: 'No meu bairro e na minha cidade' },
    'M3.P10': { estado: 'opcao', opcao: 'Pessoas comuns (consumidor final)', campos: { Idade: '30 a 44 anos', Renda: 'De 1 a 3 salários mínimos', 'Ocupação': 'Trabalhadores com carteira assinada', 'Onde mora': 'Bairro São Pedro', [DOR]: 'Não tem tempo de levar o carro ao lava-jato' } },
    'M3.P11': { estado: 'valor', valor: 'Não tem tempo de levar o carro ao lava-jato', doPerfil: true },
    'M3.P13': { estado: 'opcoes', opcoes: ['Redes sociais (Instagram, Facebook, WhatsApp)'] },
    'M3.P15': { estado: 'valor', valor: 'Lava-jato do Zé e o posto da avenida' }, 'M3.P20': { estado: 'valor', valor: 'de R$ 40 a R$ 60' },
    'M3.P21': { estado: 'valor', valor: 'Lavo na porta de casa, sem a pessoa sair' } };
  await page.goto(URL);
  await page.evaluate(([k, s, m1]) => { localStorage.clear(); localStorage.setItem(k, s); localStorage.setItem('lg2-turma-a-m01', m1); },
    [CHAVE, JSON.stringify({ v: 4, R: RESP, hist: ['RESULTADO'] }), JSON.stringify(M1(SO_CABECA))]);
  await page.reload(); await clicar('button', 'Continuar de onde parei'); await espera();
  const resH = await page.evaluate(() => ({
    p01: (() => { const e = document.querySelector('.etapa[data-cod="M3.P01"]'); return e && { r: e.querySelector('.etapa-r').textContent, selo: (e.querySelector('.selo-m') || {}).textContent }; })(),
    p11: (() => { const e = document.querySelector('.etapa[data-cod="M3.P11"]'); return e && (e.querySelector('.selo-m') || {}).textContent; })(),
    semResp: [...document.querySelectorAll('.pend')].map((x) => x.dataset.cod),
    ent: [...document.querySelectorAll('#entendemos p')].map((x) => x.textContent),
  }));
  check(resH.p01 && resH.p01.r === 'lavagem de carro em casa (serviço)' && resH.p01.selo === 'Veio do Módulo 1', 'resumo: o que vende veio do Módulo 1, com o selo');
  check(resH.p11 === 'Veio do perfil do cliente', 'resumo: a dor veio do perfil do cliente, com o selo');
  check(!resH.semResp.includes('M3.P01'), 'resumo: a pergunta herdada não aparece como "sem resposta"');
  check(resH.ent[0] === 'Você quer vender “lavagem de carro em casa” — é um serviço. A ideia ainda está no começo: você ainda não começou a vender.', `entendemos: ideia + tipo + estágio (${resH.ent[0]})`);
  check(resH.ent.includes('Você pretende vender no seu bairro e na sua cidade, e o cliente que você imagina são pessoas comuns (idade: 30 a 44 anos; renda: de 1 a 3 salários mínimos; ocupação: trabalhadores com carteira assinada; moram em Bairro São Pedro).'), 'entendemos: alcance + cliente');
  check(resH.ent.includes('Ele procura você para resolver isto: “Não tem tempo de levar o carro ao lava-jato”.') && resH.ent.includes('Ele vai encontrar você por redes sociais e WhatsApp.'), 'entendemos: dor + canais');
  check(resH.ent.includes('Quem vende algo parecido: “Lava-jato do Zé e o posto da avenida”; eles cobram em torno de R$ 50,00.'), 'entendemos: concorrentes + preço médio');
  check(resH.ent.length >= 3 && resH.ent.length <= 6, `entendemos: 3 a 6 frases (${resH.ent.length})`);
  await semCodigos('resumo com herança');
  await page.evaluate(() => document.querySelector('#entendemos').scrollIntoView({ block: 'start' }));
  await shot('09-entendemos');
  await page.evaluate(() => { document.querySelector('#respostas').open = true; });
  check(await clicar('.etapa[data-cod="M3.P01"] .ajustar', 'Ajustar'), 'resumo: botão Ajustar na resposta herdada');
  await espera();
  check(norm(await titulo()) === norm(VAR(1).pergunta) && (await page.inputValue('#ent textarea')) === 'lavagem de carro em casa (serviço)', 'Ajustar: pergunta 1 preenchida com o que veio do Módulo 1');
  check(norm(await page.evaluate(() => document.querySelector('.selo-m').textContent)) === 'Veio do Módulo 1. Confira e ajuste se quiser.', 'Ajustar: selo "Veio do Módulo 1"');
  await shot('10-p01-herdada');
  await digitar('Lava-jato que vai até a casa do cliente'); await clicar('#ok', 'Continuar'); await espera();
  check(await page.evaluate(() => !!document.querySelector('#entendemos')), 'Ajustar: volta ao resumo');
  R = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).R, CHAVE);
  check(R['M3.P01'].valor === 'Lava-jato que vai até a casa do cliente', 'Ajustar: o ajuste fica guardado neste módulo');
  check(await page.evaluate(() => document.querySelector('#entendemos p').textContent.includes('“Lava-jato que vai até a casa do cliente”')), 'entendemos: usa o ajuste');
  const m1depois = await page.evaluate(() => localStorage.getItem('lg2-turma-a-m01'));
  check(m1depois === JSON.stringify(M1(SO_CABECA)), 'Módulo 1 nunca é alterado');
  /* dor do perfil pré-preenche a pergunta 11 quando aberta */
  await abrir(11, { 'M3.P10': RESP['M3.P10'], 'M3.P11': RESP['M3.P11'] });
  check((await page.inputValue('#ent textarea')) === RESP['M3.P11'].valor && /Veio do perfil do cliente/.test(await tela()), 'pergunta 11 aberta: vem preenchida com a dor do perfil');
  /* estado da versão 3 (mesmas perguntas) é mantido */
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, JSON.stringify({ v: 3, R: { 'M3.P01': { estado: 'valor', valor: 'Vendo bolos no bairro' } }, hist: ['M3.P01', 'M3.P02'] })); }, CHAVE);
  await page.reload(); await espera();
  check(await clicar('button', 'Continuar de onde parei'), 'estado da versão 3: mantido');

  /* ============ 7. estado antigo (15 perguntas) descartado ============ */
  const antigo = JSON.stringify({ v: 2, R: { 'M3.P01': { estado: 'valor', valor: 'bolo' }, 'M3.P15': { estado: 'opcoes', opcoes: ['Outra dúvida'] }, 'M3.P04': { estado: 'valor', valor: '3' } }, hist: ['M3.P01', 'M3.P04', 'M3.P15'] });
  for (const [nome, chave] of [['mesma chave', CHAVE], ['chave antiga da turma B', 'lg2-turma-b-m03']]) {
    const n0 = erros.length;
    await page.goto(URL);
    await page.evaluate(([k, s]) => { localStorage.clear(); localStorage.setItem(k, s); }, [chave, antigo]);
    await page.reload(); await espera();
    check(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Começar')), `estado antigo (${nome}): começa do zero`);
    await clicar('button', 'Começar'); await espera();
    check(norm(await titulo()) === norm(P(1).pergunta) && (await page.inputValue('#ent textarea')) === '', `estado antigo (${nome}): pergunta 1 vazia`);
    check(erros.length === n0, `estado antigo (${nome}): sem erro de JavaScript`);
  }
  await page.goto(URL);
  await page.evaluate((k) => { localStorage.clear(); localStorage.setItem(k, '{"v":3,"R":{"M3.P99":{}},"hist":["M3.P99"]}'); }, CHAVE);
  await page.reload(); await espera();
  check(await clicar('button', 'Começar'), 'estado com código desconhecido é descartado');

  /* capa */
  await page.evaluate(() => localStorage.clear()); await page.reload(); await espera();
  await semCodigos('capa'); await fonte16('capa');
  await shot('01-inicio');

  check(erros.length === 0, 'sem erros de JavaScript: ' + erros.join(' | '));
  await browser.close(); servidor.close();
  console.log(`\n${ok} verificações OK, ${falhas.length} falhas (${LINHAS.length} linhas da aba "Caminhos por resposta")`);
  if (falhas.length) { console.log('FALHOU'); process.exit(1); }
  console.log('PASS');
})().catch((e) => { console.error(e); process.exit(1); });
