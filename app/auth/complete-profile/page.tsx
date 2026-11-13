"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, MapPin, Calendar, FileText, Users } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { normalizeNextPath } from "@/lib/utils";
import { calcularIdade } from "@/components/auth/sign-up-form";

const inputClass = "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A4A98]";

function CompleteProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const isFromOAuth = searchParams.get("from") === "oauth";
    const initialName = searchParams.get("name") || "";
    const nextParam = searchParams.get("next");

    const [fullName, setFullName] = useState(initialName);
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [document, setDocument] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [parentName, setParentName] = useState("");
    const [userType, setUserType] = useState<"student" | "teacher">("student");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isFromOAuth) {
            router.push("/auth");
        }
    }, [isFromOAuth, router]);

    const age = calcularIdade(birthDate);
    const isTeacher = userType === "teacher";
    const precisaResponsavel = !isTeacher && age !== null && age >= 0 && age < 18;

    // Aluno: só nome, nascimento (e responsável, se menor). Telefone, endereço e
    // documento são opcionais; para professor continuam obrigatórios.
    const validateForm = (): string | null => {
        if (!fullName.trim()) return "Nome completo é obrigatório";
        if (fullName.trim().split(/\s+/).length < 2) return "Digite seu nome completo";
        if (!birthDate) return "Data de nascimento é obrigatória";
        if (age === null || age < 0) return "Data de nascimento inválida";
        if (age < 5) return "Idade mínima de 5 anos";
        if (precisaResponsavel && !parentName.trim()) return "Nome do responsável é obrigatório para menores de 18 anos";

        if (isTeacher && !phone) return "Telefone é obrigatório";
        if (phone && phone.replace(/\D/g, "").length < 10) return "Telefone inválido";
        if (isTeacher && !address.trim()) return "Endereço é obrigatório";
        if (isTeacher && !document) return "Documento é obrigatório";
        if (document && document.replace(/\D/g, "").length < 11) return "Documento inválido";

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/oauth-complete-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName,
                    phone,
                    address,
                    document,
                    birthDate,
                    parentName: precisaResponsavel ? parentName.trim() : "",
                    userType,
                }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error || "Erro ao completar perfil");
            }

            toast.success("Perfil completado com sucesso!");

            // A rota pode responder "admin": nesse caso o papel já existe e não
            // passa pelo onboarding, então segue direto igual ao aluno.
            const resolvedUserType = payload?.userType ?? userType;

            if (resolvedUserType === "teacher") {
                // Redirect to complete teacher profile
                const safeNextPath = normalizeNextPath(nextParam);
                const queryStr = safeNextPath ? `&next=${encodeURIComponent(safeNextPath)}` : '';
                router.push(`/auth/complete-teacher-profile?from=oauth${queryStr}`);
            } else {
                // Redirect to protected area
                const nextPath = normalizeNextPath(nextParam) ?? "/protected";
                router.push(nextPath);
            }
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Erro ao completar perfil";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#6A4A98] to-[#8e6bc9] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                <div className="mb-6">
                    <Link
                        href="/auth"
                        className="flex items-center gap-2 text-[#6A4A98] hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Voltar</span>
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Complete seu Perfil
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                    Só falta confirmar seu nome e sua data de nascimento.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Type Selection */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Tipo de usuário</p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setUserType("student")}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${userType === "student"
                                    ? "border-[#6A4A98] bg-purple-50 text-[#6A4A98]"
                                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Aluno
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType("teacher")}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${userType === "teacher"
                                    ? "border-[#6A4A98] bg-purple-50 text-[#6A4A98]"
                                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                Professor
                            </button>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A4A98]"
                            />
                        </div>
                    </div>

                    {/* Birth Date */}
                    <div>
                        <label htmlFor="cp-birth" className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Nascimento
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                id="cp-birth"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {precisaResponsavel && (
                        <div>
                            <label htmlFor="cp-parent" className="block text-sm font-medium text-gray-700 mb-1">
                                Nome do responsável
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    id="cp-parent"
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    placeholder="Nome de um responsável"
                                    className={inputClass}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-600">Como você tem menos de 18 anos, precisamos do nome de um responsável.</p>
                        </div>
                    )}

                    {isTeacher ? (
                        <>
                    {/* Phone */}
                    <div>
                        <label htmlFor="cp-phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                id="cp-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(XX) XXXXX-XXXX"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="cp-address" className="block text-sm font-medium text-gray-700 mb-1">
                            Endereço
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                id="cp-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, número, cidade"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Document */}
                    <div>
                        <label htmlFor="cp-document" className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/Documento
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                id="cp-document"
                                value={document}
                                onChange={(e) => setDocument(e.target.value)}
                                placeholder="XXX.XXX.XXX-XX"
                                className={inputClass}
                            />
                        </div>
                    </div>

                        </>
                    ) : (
                        <details className="rounded-lg border border-gray-200 p-3">
                            <summary className="cursor-pointer text-sm font-medium text-[#6A4A98]">
                                Adicionar mais dados (opcional)
                            </summary>
                            <div className="mt-3 space-y-4">
                    {/* Phone */}
                    <div>
                        <label htmlFor="cp-phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                id="cp-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(XX) XXXXX-XXXX"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="cp-address" className="block text-sm font-medium text-gray-700 mb-1">
                            Endereço
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                id="cp-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Rua, número, cidade"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Document */}
                    <div>
                        <label htmlFor="cp-document" className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/Documento
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                id="cp-document"
                                value={document}
                                onChange={(e) => setDocument(e.target.value)}
                                placeholder="XXX.XXX.XXX-XX"
                                className={inputClass}
                            />
                        </div>
                    </div>

                            </div>
                        </details>
                    )}
                    {!isTeacher && (
                        <p className="text-xs text-gray-600">
                            Telefone, endereço e documento você pode completar depois no seu perfil, se quiser.
                        </p>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-full bg-[#6A4A98] py-2 text-base font-semibold text-white hover:bg-[#5a3e85] transition-all mt-6"
                    >
                        {isLoading ? "Salvando..." : "Continuar"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#6A4A98] to-[#8e6bc9]" />}>
            <CompleteProfileContent />
        </Suspense>
    );
}
