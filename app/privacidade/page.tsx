import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Data desta versão do texto. Mude junto com o conteúdo, nunca para a data do dia.
const ULTIMA_ATUALIZACAO = "23/11/2026";

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="mb-6">
          <Link href="/auth">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-[#6A4A98]">
              <ArrowLeft size={20} /> Voltar para o cadastro
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#6A4A98] mb-8">Política de Privacidade</h1>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">1. Coleta de Informações</h2>
            <p className="text-gray-600 leading-relaxed">
              Pedimos só o que precisamos para você usar a plataforma. O que guardamos depende de como você se cadastra:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Alunos:</strong> nome completo, data de nascimento e e-mail. Se você tem menos de 18 anos, também o nome do seu responsável.</li>
              <li><strong>Professores:</strong> nome completo, data de nascimento, e-mail, CPF, telefone, endereço, escolas onde você atua, escolaridade, formação e o comprovante de qualificação que você enviar (diploma ou comprovante de cargo).</li>
              <li><strong>Se você entra com sua conta Google:</strong> recebemos dela seu nome, seu e-mail e sua foto.</li>
              <li><strong>O que é opcional:</strong> se você é aluno, telefone, endereço e CPF só ficam guardados se você mesmo preencher no seu perfil. A foto de perfil também é opcional.</li>
              <li><strong>Seu uso da plataforma:</strong> aulas concluídas, atividades enviadas, respostas e pontuação nos jogos, e os módulos que você abriu e terminou.</li>
              <li><strong>Equipe do projeto (bolsistas e coordenação):</strong> também os registros do trabalho na equipe, como encontros, atividades, relatórios e fotos de comprovação.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">2. Uso das Informações</h2>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Personalizar sua experiência de aprendizado (alunos) ou ensino (professores).</li>
              <li>Emitir certificados e registrar progresso acadêmico.</li>
              <li>Comunicar atualizações importantes sobre a plataforma ou cursos.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">3. Proteção de Dados</h2>
            <p className="text-gray-600 leading-relaxed">
              Adotamos medidas de segurança para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Professores e colegas não veem sua data de nascimento, seu telefone nem seu endereço.
            </p>
            <p className="text-gray-600 leading-relaxed">
              O certificado traz seu nome e, se você informou, seu CPF; o professor que emite o certificado do curso também tem acesso a ele. Na página pública de validação do certificado, quem tem o código vê seu nome, o curso e só uma parte do CPF.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">4. Compartilhamento de Dados</h2>
            <p className="text-gray-600 leading-relaxed">
              Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto quando necessário para fornecer o serviço ou quando exigido por lei. Para a plataforma funcionar, usamos estes serviços:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Supabase:</strong> guarda o banco de dados, os arquivos enviados e o seu acesso (e-mail e senha). Os servidores ficam nos Estados Unidos, então seus dados são armazenados fora do Brasil.</li>
              <li><strong>Resend:</strong> envia os e-mails da plataforma, como a confirmação do cadastro e os avisos.</li>
              <li><strong>YouTube:</strong> os vídeos das aulas são exibidos pelo YouTube, que pode registrar quando você assiste, conforme as regras do Google.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">5. Seus Direitos</h2>
            <p className="text-gray-600 leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a solicitar acesso, correção ou exclusão de seus dados pessoais em nossa base. Você pode excluir sua conta a qualquer momento pelo seu perfil. Para exercer os outros direitos, entre em contato com nosso suporte.
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500 border-t mt-8">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </div>
        </div>
      </div>
    </div>
  );
}
