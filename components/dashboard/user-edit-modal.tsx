"use client";
// UserEditModal: formulário modal para edição de email, nome e tipo do usuário.
// Usa server action `updateUserAction` passada via props.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UserProfileSummary } from "@/lib/api/types";

type EditFormState = { display_name: string; type: 'admin' | 'teacher' | 'student'; email: string };

interface UserEditModalProps {
    user: UserProfileSummary;
    onClose: () => void;
    updateUserAction: (formData: FormData) => Promise<void>;
}

export function UserEditModal({ user, onClose, updateUserAction }: UserEditModalProps) {
    const [form, setForm] = useState<EditFormState>({ display_name: user.fullName || '', type: (user.role as EditFormState['type']) || 'student', email: user.email || '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        try {
            await updateUserAction(fd);
            onClose();
            window.location.reload();
        } catch (err) {
            console.error("Falha ao atualizar usuário", err);
            const message = err instanceof Error ? err.message : "Falha ao atualizar usuário";
            alert(message);
        } finally {
            setLoading(false);
        }

    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">Editar usuário</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={user.id} />
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Nome</Label>
                        <Input id="display_name" name="display_name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <select
                            id="type"
                            name="type"
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value as EditFormState['type'] }))}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="student">Aluno</option>
                            <option value="teacher">Professor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
