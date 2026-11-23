import { cn } from "@/lib/utils";
import { BOTAO_PRIMARIO } from "./botoes";

/**
 * Ação principal de uma lista que abre um formulário (Nova meta, Novo pedido...).
 * Fica no canto direito do cabeçalho da seção; aberta, ocupa a linha inteira
 * e o formulário aparece embaixo do botão. Sem JavaScript: `<details>` nativo.
 */
export function AcaoComFormulario({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <details className="group ml-auto text-right open:basis-full">
      <summary className={cn(BOTAO_PRIMARIO, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
        <span aria-hidden="true" className="group-open:hidden">+</span>
        <span aria-hidden="true" className="hidden group-open:inline">×</span>
        {rotulo}
      </summary>
      <div className="mt-3 text-left">{children}</div>
    </details>
  );
}
