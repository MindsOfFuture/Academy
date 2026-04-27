"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowLeft, School, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function CompleteTeacherProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const isFromOAuth = searchParams.get("from") === "oauth";

    const [schools, setSchools] = useState<string[]>(["", ""]);
    const [educationLevel, setEducationLevel] = useState("");
    const [degree, setDegree] = useState("");
    const [qualificationFile, setQualificationFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isFromOAuth) {
            router.push("/auth");
        }
    }, [isFromOAuth, router]);

    const addSchool = () => setSchools([...schools, ""]);
    const removeSchool = (index: number) => {
        if (schools.length > 1) {
            setSchools(schools.filter((_, i) => i !== index));
        }
    };
    const updateSchool = (index: number, value: string) => {
        const updated = [...schools];
        updated[index] = value;
        setSchools(updated);
    };

    const validateForm = (): string | null => {
        if (!educationLevel) return "Selecione o grau de escolaridade";
        if (!degree.trim()) return "Formação acadêmica é obrigatória";
        if (schools.some((s) => !s.trim())) return "Preencha todas as escolas";
        if (!qualificationFile) return "Anexe o comprovante de qualificação";
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
            const supabase = createClient();
            const { data: authData } = await supabase.auth.getUser();

            if (!authData.user) {
                throw new Error("Usuário não autenticado");
            }

            // Upload qualification document
            let qualificationDocumentUrl: string | null = null;
            if (qualificationFile) {
                const fileName = `${authData.user.id}-${Date.now()}-${qualificationFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from("teacher-qualification-documents")
                    .upload(fileName, qualificationFile);

                if (uploadError) throw uploadError;

                const { data: publicUrl } = supabase.storage
                    .from("teacher-qualification-documents")
                    .getPublicUrl(fileName);

                qualificationDocumentUrl = publicUrl.publicUrl;
            }

            // Create teacher_details record
            const { error: detailsError } = await supabase
                .from("teacher_details")
                .insert({
                    user_id: authData.user.id,
                    schools: schools.filter((s) => s.trim()),
                    education_level: educationLevel,
                    degree,
                });

            if (detailsError && detailsError.code !== "23505") {
                throw detailsError;
            }

            // Create teacher_request record
            const { error: requestError } = await supabase
                .from("teacher_request")
                .insert({
                    user_id: authData.user.id,
                    status: "pending",
                    qualification_document_url: qualificationDocumentUrl,
                    observations: "Professor se cadastrou via OAuth e aguarda verificação",
                });

            if (requestError) throw requestError;

            // Update user profile verification status
            await supabase
                .from("user_profile")
                .update({ verification_status: "pending" })
                .eq("id", authData.user.id);

            // Notify admins
            try {
                const fullName =
                    (await supabase
                        .from("user_profile")
                        .select("full_name")
                        .eq("id", authData.user.id)
                        .maybeSingle()).data?.full_name || "Professor";

                await fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "notify_admins",
                        type: "teacher_pending_approval",
                        payload: {
                            title: fullName,
                            message: `O professor ${fullName} criou uma conta via Google e aguarda aprovação.`,
                            href: "/protected",
                        },
                    }),
                });
            } catch (notifyError) {
                console.error("Erro ao notificar admins:", notifyError);
            }

            toast.success("Perfil de professor enviado para verificação!");
            router.push("/protected");
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
        <div className="min-h-screen bg-gradient-to-br from-[#6A4A98] to-[#8e6bc9] flex items-center justify-center p-4 py-8">
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
                    Dados Profissionais
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                    Complete suas informações profissionais para finalizar o cadastro.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Education Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grau de Escolaridade
                        </label>
                        <select
                            value={educationLevel}
                            onChange={(e) => setEducationLevel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A4A98]"
                        >
                            <option value="">Selecione...</option>
                            <option value="ensino_fundamental">Ensino Fundamental</option>
                            <option value="ensino_medio">Ensino Médio</option>
                            <option value="superior">Superior</option>
                            <option value="pos_graduacao">Pós-graduação</option>
                        </select>
                    </div>

                    {/* Degree */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Formação Acadêmica
                        </label>
                        <input
                            type="text"
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            placeholder="Ex: Licenciatura em Matemática"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A4A98]"
                        />
                    </div>

                    {/* Schools */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Escolas de Atuação
                        </label>
                        <div className="space-y-2">
                            {schools.map((school, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <School
                                            className="absolute left-3 top-3 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            value={school}
                                            onChange={(e) => updateSchool(index, e.target.value)}
                                            placeholder={`Escola ${index + 1}`}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6A4A98]"
                                        />
                                    </div>
                                    {schools.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeSchool(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addSchool}
                            className="mt-2 flex items-center gap-1 text-sm text-[#6A4A98] hover:opacity-80 transition-opacity"
                        >
                            <Plus size={16} />
                            Adicionar Escola
                        </button>
                    </div>

                    {/* Qualification Document */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comprovante de Qualificação
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={(e) => setQualificationFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-input"
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label
                                htmlFor="file-input"
                                className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#6A4A98] transition-colors"
                            >
                                <Upload size={20} className="text-gray-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        {qualificationFile?.name || "Clique para enviar"}
                                    </p>
                                    <p className="text-xs text-gray-500">PDF, JPG ou PNG</p>
                                </div>
                            </label>
                        </div>
                    </div>

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
                        {isLoading ? "Enviando..." : "Completar Cadastro"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function CompleteTeacherProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#6A4A98] to-[#8e6bc9]" />}>
            <CompleteTeacherProfileContent />
        </Suspense>
    );
}
