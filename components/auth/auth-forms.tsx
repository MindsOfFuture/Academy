"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/sign-up-form";

export function AuthForms() {
    const [view, setView] = useState<'login' | 'signup'>('login');

    const toggleView = () => {
        setView(view === 'login' ? 'signup' : 'login');
    };

    return (
        <div className="relative mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl shadow-2xl">
            <div className="hidden md:flex md:flex-row">
                <LoginForm onToggleView={toggleView} />
                <SignUpForm onToggleView={toggleView} />
            </div>

            <div className="md:hidden">
                {view === 'login' ? (
                    <LoginForm onToggleView={toggleView} />
                ) : (
                    <SignUpForm onToggleView={toggleView} />
                )}
            </div>
        </div>
    );
}