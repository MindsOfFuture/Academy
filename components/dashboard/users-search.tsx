"use client";
// UsersSearch: input controlado para filtrar usuários por nome ou email.
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsersSearchProps {
    value: string;
    onChange: (v: string) => void;
}

export function UsersSearch({ value, onChange }: UsersSearchProps) {
    return (
        <div className="w-full">
            <Label htmlFor="user-search" className="sr-only">Pesquisar usuários</Label>
            <Input
                id="user-search"
                placeholder="Pesquisar por nome ou email..."
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-9"
            />
        </div>
    );
}
