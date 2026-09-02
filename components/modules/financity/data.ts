export type Regime = "CLT" | "PJ";
export type EstadoCivil = "solteiro" | "casado";
export type Filhos = "0" | "1" | "2" | "3+";
export type Imovel = "apartamento" | "casa" | "mansao" | "sitio";
export type Aquisicao = "alugada" | "financiada" | "propria";
export type Transporte = "carro" | "moto" | "bicicleta" | "publico";
export type Alimentacao = "masterchef" | "delivery" | "gourmet";
export type Poupanca = "nao" | "5%" | "10%" | "20%";
export type Imprevisto = "seguro" | "reserva" | "nenhum";
export type PetKey = "cachorro" | "gato" | "outros";
export type StreamingKey = "netflix" | "disney" | "spotify" | "prime" | "academia";
export type LazerKey = "cinema" | "restaurantes" | "shopping" | "viagens";

export type GameState = {
  nome: string;
  profissao: string;
  profissaoReconhecida: boolean;
  salarioBruto: number;
  regime: Regime | null;
  estadoCivil: EstadoCivil | null;
  filhos: Filhos | null;
  pets: PetKey[];
  imovel: Imovel | null;
  aquisicao: Aquisicao | null;
  transporte: Transporte | null;
  streaming: StreamingKey[];
  alimentacao: Alimentacao | null;
  poupanca: Poupanca | null;
  lazer: LazerKey[];
  imprevisto: Imprevisto | null;
};

export const ESTADO_INICIAL: GameState = {
  nome: "",
  profissao: "",
  profissaoReconhecida: false,
  salarioBruto: 0,
  regime: null,
  estadoCivil: null,
  filhos: null,
  pets: [],
  imovel: null,
  aquisicao: null,
  transporte: null,
  streaming: [],
  alimentacao: null,
  poupanca: null,
  lazer: [],
  imprevisto: null,
};

export const DECISOES = [
  { id: "nome", titulo: "Como você se chama?" },
  { id: "profissao", titulo: "Qual profissão sustenta sua vida futura?" },
  { id: "regime", titulo: "Você trabalha em regime CLT ou PJ?" },
  { id: "estadoCivil", titulo: "Qual é o seu estado civil?" },
  { id: "filhos", titulo: "Quantos filhos fazem parte da família?" },
  { id: "pets", titulo: "Há animais de estimação?" },
  { id: "imovel", titulo: "Em que tipo de imóvel você quer morar?" },
  { id: "aquisicao", titulo: "O imóvel será alugado, financiado ou próprio?" },
  { id: "transporte", titulo: "Como você pretende se locomover?" },
  { id: "streaming", titulo: "Quais assinaturas entram no orçamento?" },
  { id: "alimentacao", titulo: "Como será sua alimentação?" },
  { id: "poupanca", titulo: "Quanto da renda irá para a reserva?" },
  { id: "lazer", titulo: "Quais atividades de lazer você manterá?" },
  { id: "imprevisto", titulo: "Como você lidará com imprevistos?" },
] as const;

export const PERFIS = [
  { id: "superendividado", titulo: "Superendividado" },
  { id: "poupador", titulo: "Poupador Extremo" },
  { id: "equilibrado", titulo: "Equilibrado" },
  { id: "gastador", titulo: "Gastador Livre" },
] as const;

export const SESSOES_STORAGE_KEY = "academy-financity-sessoes-v1";
