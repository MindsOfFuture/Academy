import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermosDeUso() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-[#6A4A98] mb-8">Termos de Uso</h1>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">1. Aceitação dos Termos</h2>
            <p className="text-gray-600 leading-relaxed">
              Ao criar uma conta na Academy, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">2. Dados do Usuário</h2>
            <p className="text-gray-600 leading-relaxed">
              Você garante que todas as informações fornecidas durante o registro (incluindo, mas não se limitando a: nome completo, CPF, endereço, telefone e informações educacionais) são verdadeiras, precisas e completas.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Para <strong>Alunos</strong>: As informações sobre escola, série e responsável devem ser verídicas.</li>
              <li>Para <strong>Professores</strong>: As informações sobre formação acadêmica e vínculos escolares devem ser comprováveis.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">3. Uso da Plataforma</h2>
            <p className="text-gray-600 leading-relaxed">
              A licença para uso da plataforma é pessoal, intransferível e revogável. É estritamente proibido:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Compartilhar suas credenciais de acesso com terceiros.</li>
              <li>Utilizar a plataforma para fins ilegais ou não autorizados.</li>
              <li>Tentar descompilar ou realizar engenharia reversa de qualquer software contido na plataforma.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">4. Responsabilidades</h2>
            <p className="text-gray-600 leading-relaxed">
              A Academy não se responsabiliza por danos diretos ou indiretos decorrentes do uso ou da incapacidade de usar a plataforma. Nós nos esforçamos para manter as informações educacionais precisas, mas não garantimos que todo o conteúdo esteja sempre atualizado.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">5. Modificações</h2>
            <p className="text-gray-600 leading-relaxed">
              A Academy pode revisar estes termos de serviço a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.
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
