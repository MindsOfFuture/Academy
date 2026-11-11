"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export function FormularioTeste() {
  const [estado, action, pendente] = useActionState(entrar, {});
  return (
    <form action={action} className="w-full max-w-md space-y-5 rounded-3xl border border-purple-100 bg-white p-6 shadow-lg sm:p-8">
      <h1 className="text-3xl font-bold text-purple-950">Teste do Laboratório de Gestão</h1>
      <label className="block font-semibold text-purple-950">Nome completo
        <input name="nome" required minLength={3} maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border border-purple-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-600" />
      </label>
      <label className="block font-semibold text-purple-950">CPF
        <input name="cpf" required inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" className="mt-2 w-full rounded-xl border border-purple-200 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-600" />
      </label>
      <p className="text-sm text-gray-600">Usamos seu nome e CPF só para contar a participação no teste.</p>
      {estado.erro && <p role="alert" className="text-sm font-semibold text-red-700">{estado.erro}</p>}
      <button disabled={pendente} className="w-full rounded-xl bg-amber-300 px-5 py-3 font-bold text-purple-950 hover:bg-amber-200 disabled:opacity-60">{pendente ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
