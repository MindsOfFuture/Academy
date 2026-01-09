"use client";
// UserDeleteConfirmModal: confirma exclusão irreversível do usuário.
// Chama callback onConfirm (server action wrapper) e exibe loading durante a operação.
import { Button } from "@/components/ui/button";
import { type UserProfileSummary } from "@/lib/api/types";
import { useState } from "react";

interface UserDeleteConfirmModalProps {
    user: UserProfileSummary;
    onClose: () => void;
    onConfirm: (formData: FormData) => Promise<void>;
}

export function UserDeleteConfirmModal({ user, onClose, onConfirm }: UserDeleteConfirmModalProps) {
    const [loading, setLoading] = useState(false);

    async function action(formData: FormData) {
        setLoading(true);
        try {
            await onConfirm(formData);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => !loading && onClose()} />
            <div className="relative z-10 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
                <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja excluir o usuário <span className="font-medium break-all">{user.email || user.fullName || user.id}</span>? Esta ação não pode ser desfeita.</p>
                <form action={action} className="flex justify-end gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="destructive" disabled={loading}>{loading ? 'Excluindo...' : 'Excluir'}</Button>
                </form>
            </div>
        </div>
    );
}
