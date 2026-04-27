"use client";

import { Suspense, useState } from "react";
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
                <Suspense fallback={<div className="w-full bg-white p-8 md:w-1/2 lg:p-12" />}>
                    <LoginForm onToggleView={toggleView} />
                </Suspense>
                <SignUpForm onToggleView={toggleView} />
            </div>

            <div className="md:hidden">
                {view === 'login' ? (
                    <Suspense fallback={<div className="w-full bg-white p-8" />}>
                        <LoginForm onToggleView={toggleView} />
                    </Suspense>
                ) : (
                    <SignUpForm onToggleView={toggleView} />
                )}
            </div>
        </div>
    );
}