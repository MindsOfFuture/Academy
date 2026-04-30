"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteAccountModalProps {
  isTeacher: boolean;
  onClose: () => void;
  onConfirm: (confirmation: string) => Promise<void>;
  loading: boolean;
}

export function DeleteAccountModal({ isTeacher, onClose, onConfirm, loading }: DeleteAccountModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const normalized = confirmation.trim().toUpperCase();
  const canConfirm = normalized === "EXCLUIR";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canConfirm || loading) return;
    await onConfirm(confirmation);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !loading && onClose()} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Excluir conta permanentemente</h3>
        <p className="text-sm text-gray-600 mb-3">
          Esta ação é irreversível. Seus dados pessoais serão removidos e sua conta será excluída.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Seus conteúdos (postagens, comentários, materiais) não serão apagados, mas ficarão anônimos.
        </p>
        {isTeacher && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Caso deseje que seus conteúdos não fiquem na plataforma, você deve apagá-los manualmente antes de confirmar
            a exclusão da conta. Do contrário, eles permanecerão no site de forma anônima.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">
            Digite EXCLUIR para confirmar
          </label>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="EXCLUIR"
            className="w-full"
            disabled={loading}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || !canConfirm}>
              {loading ? "Excluindo..." : "Excluir conta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
