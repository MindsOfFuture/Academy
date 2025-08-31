"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "../api/admApi";

interface UsersTableClientProps {
    users: UserProfile[];
    deleteUserAction: (formData: FormData) => Promise<void>;
    updateUserAction: (formData: FormData) => Promise<void>;
}

type EditFormState = { display_name: string; type: 'adm' | 'normal'; email: string };

export default function UsersTableClient({ users, deleteUserAction, updateUserAction }: UsersTableClientProps) {
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [form, setForm] = useState<EditFormState>({ display_name: "", type: "normal", email: "" });
    const [loading, setLoading] = useState(false);

    function onEdit(u: UserProfile) {
        setEditingUser(u);
        setForm({ display_name: u.display_name || "", type: u.type, email: u.email || "" });
        setOpen(true);
    }

    function close() {
        if (loading) return;
        setOpen(false);
        setEditingUser(null);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editingUser) return;
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        try {
            await updateUserAction(fd);
            close();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="text-center sm:text-left mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
            </div>
            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-4xl">
                    {users.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">Email</th>
                                    <th className="text-left py-2 px-4">Nome</th>
                                    <th className="text-left py-2 px-4">Tipo</th>
                                    <th className="text-center py-2 px-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="py-2 px-4 text-sm break-all">{u.email}</td>
                                        <td className="py-2 px-4 text-sm">{u.display_name}</td>
                                        <td className="py-2 px-4 text-sm">{u.type}</td>
                                        <td className="py-2 px-4 text-center space-y-1">
                                            <form action={deleteUserAction} className="inline-block mr-2">
                                                <input type="hidden" name="id" value={u.id} />
                                                <Button variant="destructive" size="sm">Apagar</Button>
                                            </form>
                                            <Button variant="outline" size="sm" onClick={() => onEdit(u)}>Editar</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="h-48 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500">Nenhum usuário encontrado</span>
                        </div>
                    )}
                </div>
            </div>

            {open && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={close} />
                    <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Editar usuário</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="hidden" name="id" value={editingUser.id} />
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
                                    <option value="normal">Normal</option>
                                    <option value="adm">Administrador</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={close} disabled={loading}>Cancelar</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
