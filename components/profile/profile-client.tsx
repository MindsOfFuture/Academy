"use client";

import { useState } from "react";
import { updateUserProfileClient } from "@/lib/api/profiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileClientProps {
    userId: string;
    initialName: string;
    initialEmail: string;
    userType: string;
}

export function ProfileClient({ userId, initialName, initialEmail, userType }: ProfileClientProps) {
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [savingProfile, setSavingProfile] = useState(false);

    function initials() {
        if (name?.trim()) {
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0][0]?.toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return email?.[0]?.toUpperCase() || "U";
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Nome não pode ser vazio");
            return;
        }
        setSavingProfile(true);
        try {
            const { message } = await updateUserProfileClient({ userId, name, email, originalEmail: initialEmail });
            toast.success(message);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar';
            toast.error(msg);
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="space-y-10">
            <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#684A97] to-[#8e6bc9] text-white flex items-center justify-center text-2xl font-semibold shadow-md select-none">
                        {initials()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">Meu Perfil</h2>
                        <p className="text-sm text-gray-600">Gerencie suas informações pessoais e segurança da conta.</p>
                        <div className="mt-2 inline-flex items-center text-xs px-3 py-1 rounded-full bg-[#684A97]/10 text-[#684A97] font-medium uppercase tracking-wide">
                            {userType === 'admin' ? 'Administrador' : userType === 'teacher' ? 'Professor' : 'Usuário'}
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Nome</label>
                        <div className="relative flex items-center">
                            <UserIcon className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu email" className="w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Alterar e-mail pode exigir confirmação.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={savingProfile} className="rounded-full bg-[#6A4A98] hover:bg-[#5a3e85]">
                            {savingProfile ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
