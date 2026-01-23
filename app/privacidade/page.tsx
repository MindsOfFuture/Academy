import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
              Para fornecer nossos serviços educacionais, coletamos as seguintes informações pessoais quando você se cadastra:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><strong>Dados Pessoais:</strong> Nome completo, CPF, data de nascimento.</li>
              <li><strong>Dados de Contato:</strong> Endereço de e-mail, número de telefone e endereço residencial.</li>
              <li><strong>Dados Educacionais:</strong> Informações sobre escola, série, responsáveis (para alunos) e formação acadêmica (para professores).</li>
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
              Adotamos medidas de segurança técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Seus dados sensíveis são armazenados de forma criptografada.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">4. Compartilhamento de Dados</h2>
            <p className="text-gray-600 leading-relaxed">
              Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto quando necessário para fornecer o serviço (ex: parceiros de infraestrutura) ou quando exigido por lei.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">5. Seus Direitos</h2>
            <p className="text-gray-600 leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a solicitar acesso, correção ou exclusão de seus dados pessoais em nossa base. Para exercer esses direitos, entre em contato com nosso suporte.
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500 border-t mt-8">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>
    </div>
  );
}
