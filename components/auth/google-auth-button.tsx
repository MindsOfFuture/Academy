"use client";

import { signInWithGoogle } from "@/lib/api/oauth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import toast from "react-hot-toast";

interface GoogleAuthButtonProps {
    nextPath?: string;
}

export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle(nextPath);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Erro ao fazer login com Google";
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full rounded-full border-2 border-[#6A4A98] bg-transparent py-6 text-base font-semibold text-[#6A4A98] hover:bg-[#6A4A98]/5 transition-all"
        >
            {isLoading ? "Conectando..." : "Continuar com Google"}
        </Button>
    );
}
