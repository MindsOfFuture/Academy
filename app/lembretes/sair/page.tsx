import Image from "next/image";
import Link from "next/link";

/**
 * Página do link "Não quero mais receber estes lembretes" dos e-mails do
 * Empreenda+ (spec 027). Abrir o link não muda nada: a pessoa confirma no botão
 * (leitores de e-mail e antivírus abrem links sozinhos).
 */

export const dynamic = "force-dynamic";

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Busca = { t?: string; ok?: string; erro?: string };

export default async function SairDosLembretesPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const { t = "", ok, erro } = await searchParams;
  const valido = TOKEN.test(t);

  let titulo: string;
  let texto: string;
  if (ok) {
    titulo = "Pronto, lembretes desligados";
    texto = "Você não vai mais receber e-mails de lembrete do Empreenda+. A sua trilha continua lá, e você pode voltar quando quiser.";
  } else if (erro || !valido) {
    titulo = "Não encontramos este link";
    texto = "O link pode estar incompleto. Abra de novo o link do e-mail ou escreva para a equipe do Minds of the Future.";
  } else {
    titulo = "Parar os lembretes do Empreenda+?";
    texto = "Mandamos no máximo três lembretes quando faltam etapas na sua trilha. Se preferir, paramos agora.";
  }

  return (
    <main className="min-h-screen bg-[#ECE9F3] px-4 py-10">
      <div className="mx-auto max-w-lg overflow-hidden rounded-[14px] bg-white">
        <div className="flex items-center gap-3 bg-[#684A97] px-6 py-5">
          <Image src="/email/minds.png" alt="Minds of the Future" width={45} height={44} />
          <span className="text-2xl font-bold text-[#FFD300]">Empreenda+</span>
        </div>
        <div className="space-y-4 px-6 py-6 text-[#333333]">
          <h1 className="text-2xl font-bold text-[#684A97]">{titulo}</h1>
          <p className="leading-relaxed">{texto}</p>
          {valido && !ok && !erro ? (
            <form method="post" action={`/api/lembretes/sair?t=${encodeURIComponent(t)}`}>
              <input type="hidden" name="origem" value="pagina" />
              <button
                type="submit"
                className="rounded-full bg-[#684A97] px-6 py-3 font-bold text-white hover:opacity-90"
              >
                Parar os lembretes
              </button>
            </form>
          ) : (
            <Link
              href="/lg2/jornada/index.html"
              className="inline-block rounded-full bg-[#684A97] px-6 py-3 font-bold text-white hover:opacity-90"
            >
              Ir para a minha trilha
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 border-t border-[#ECE9F3] px-6 py-4">
          <Image src="/email/facc.png" alt="FACC/UFJF" width={96} height={32} className="h-8 w-auto" />
          <Image src="/email/ufjf.png" alt="UFJF" width={96} height={32} className="h-8 w-auto" />
          <Image src="/email/mg.png" alt="Governo de Minas Gerais" width={96} height={32} className="h-8 w-auto" />
        </div>
      </div>
    </main>
  );
}
