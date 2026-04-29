"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateTeacherProfileClient, updateUserProfileClient, uploadAvatarClient, removeAvatarClient } from "@/lib/api/profiles";
import { type TeacherVerificationStatus } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Save, RefreshCw, Camera, Trash2, Upload, Phone, MapPin, School, GraduationCap, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";

interface ProfileClientProps {
    userId: string;
    initialName: string;
    initialEmail: string;
    userType: string;
    initialAvatarUrl?: string | null;
    initialBio?: string | null;
    initialPhone?: string | null;
    initialAddress?: string | null;
    initialSpecialties?: string[];
    initialCertifications?: string[];
    verificationStatus?: TeacherVerificationStatus;
    verificationReason?: string | null;
    initialVerificationDocumentUrl?: string | null;
    // Teacher-specific
    initialSchools?: string[];
    initialEducationLevel?: string | null;
    initialDegree?: string | null;
}

function toCsv(items: string[] = []) {
    return items.join(", ");
}

function fromCsv(value: string) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function verificationStatusText(status: TeacherVerificationStatus) {
    if (status === "approved") return "Aprovado";
    if (status === "rejected") return "Reprovado";
    if (status === "pending") return "Pendente";
    return "Não enviado";
}

function verificationStatusStyle(status: TeacherVerificationStatus) {
    if (status === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
}

const EDUCATION_LEVEL_OPTIONS = [
    { value: "", label: "Selecione o grau de escolaridade" },
    { value: "graduacao", label: "Graduação" },
    { value: "pos-graduacao", label: "Pós-Graduação" },
    { value: "mestrado", label: "Mestrado" },
    { value: "doutorado", label: "Doutorado" },
    { value: "pos-doutorado", label: "Pós-Doutorado" },
];

function educationLevelLabel(value: string | null | undefined): string {
    if (!value) return "";
    const option = EDUCATION_LEVEL_OPTIONS.find((o) => o.value === value);
    return option?.label || value;
}

export function ProfileClient({
    userId,
    initialName,
    initialEmail,
    userType,
    initialAvatarUrl,
    initialBio,
    initialPhone,
    initialAddress,
    initialSpecialties,
    initialCertifications,
    verificationStatus,
    verificationReason,
    initialVerificationDocumentUrl,
    initialSchools,
    initialEducationLevel,
    initialDegree,
}: ProfileClientProps) {
    const router = useRouter();
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone || "");
    const [address, setAddress] = useState(initialAddress || "");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
    const [bio, setBio] = useState(initialBio || "");
    const [specialtiesCsv, setSpecialtiesCsv] = useState(toCsv(initialSpecialties || []));
    const [certificationsCsv, setCertificationsCsv] = useState(toCsv(initialCertifications || []));
    const [qualificationDocumentUrl, setQualificationDocumentUrl] = useState<string | null>(initialVerificationDocumentUrl || null);
    const [qualificationFile, setQualificationFile] = useState<File | null>(null);
    const [uploadingQualification, setUploadingQualification] = useState(false);
    const [verificationStatusState, setVerificationStatusState] = useState<TeacherVerificationStatus>(verificationStatus || null);
    const [verificationReasonState, setVerificationReasonState] = useState<string | null>(verificationReason || null);
    const [reverificationNotice, setReverificationNotice] = useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Teacher-specific fields
    const [schoolsCsv, setSchoolsCsv] = useState(toCsv(initialSchools || []));
    const [educationLevel, setEducationLevel] = useState(initialEducationLevel || "");
    const [degree, setDegree] = useState(initialDegree || "");

    function initials() {
        if (name?.trim()) {
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0][0]?.toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return email?.[0]?.toUpperCase() || "U";
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const newAvatarUrl = await uploadAvatarClient(userId, file);
            setAvatarUrl(newAvatarUrl);
            toast.success("Foto de perfil atualizada!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao fazer upload';
            toast.error(msg);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!avatarUrl) return;

        const confirmRemove = window.confirm("Deseja remover sua foto de perfil?");
        if (!confirmRemove) return;

        setRemovingAvatar(true);
        try {
            await removeAvatarClient(userId);
            setAvatarUrl(null);
            toast.success("Foto de perfil removida!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao remover foto';
            toast.error(msg);
        } finally {
            setRemovingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Nome não pode ser vazio");
            return;
        }
        setSavingProfile(true);
        try {
            const { message } = await updateUserProfileClient({ userId, name, email, originalEmail: initialEmail, phone, address });
            if (userType === "teacher") {
                let nextDocumentUrl = qualificationDocumentUrl;
                if (qualificationFile) {
                    setUploadingQualification(true);
                    const uploadForm = new FormData();
                    uploadForm.append("file", qualificationFile);

                    const uploadResponse = await fetch("/api/auth/teacher-qualification-upload", {
                        method: "POST",
                        body: uploadForm,
                    });
                    const uploadPayload = await uploadResponse.json().catch(() => null);
                    if (!uploadResponse.ok || !uploadPayload?.url) {
                        throw new Error(uploadPayload?.error || "Falha ao enviar comprovante de qualificação.");
                    }
                    nextDocumentUrl = uploadPayload.url;
                    setQualificationDocumentUrl(uploadPayload.url);
                }

                const teacherResult = await updateTeacherProfileClient({
                    userId,
                    bio,
                    specialties: fromCsv(specialtiesCsv),
                    certifications: fromCsv(certificationsCsv),
                    qualificationDocumentUrl: nextDocumentUrl,
                    schools: fromCsv(schoolsCsv),
                    educationLevel,
                    degree,
                });
                setVerificationStatusState(teacherResult.verificationStatus || verificationStatusState);
                if (teacherResult.reverificationRequested) {
                    setVerificationReasonState(null);
                    setReverificationNotice("Seu perfil foi reenviado e está em verificação pendente para reavaliação.");
                } else {
                    setReverificationNotice(null);
                }
                toast.success(teacherResult.message);
            } else {
                toast.success(message);
            }
            setQualificationFile(null);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar';
            toast.error(msg);
        } finally {
            setUploadingQualification(false);
            setSavingProfile(false);
        }
    };

    const handleDeleteAccount = async (confirmation: string) => {
        setDeletingAccount(true);
        try {
            const response = await fetch("/api/profile/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmation }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error || "Falha ao excluir conta");
            }

            const supabase = createBrowserSupabase();
            await supabase.auth.signOut();
            toast.success("Conta excluída com sucesso.");
            router.push("/");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao excluir conta";
            toast.error(msg);
        } finally {
            setDeletingAccount(false);
            setDeleteModalOpen(false);
        }
    };

    const inputClass = "w-full rounded-full border-none bg-[#F3F0F9] py-6 pl-12 pr-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#6A4A98] focus-visible:ring-offset-2";

    return (
        <div className="space-y-10">
            <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar com suporte a foto */}
                    <div className="relative group">
                        <div
                            onClick={handleAvatarClick}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#684A97] to-[#8e6bc9] text-white flex items-center justify-center text-2xl font-semibold shadow-md select-none cursor-pointer overflow-hidden relative"
                        >
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                initials()
                            )}

                            {/* Overlay de hover */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingAvatar ? (
                                    <RefreshCw className="animate-spin text-white" size={24} />
                                ) : (
                                    <Camera className="text-white" size={24} />
                                )}
                            </div>
                        </div>

                        {/* Input de arquivo oculto */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploadingAvatar}
                        />

                        {/* Texto de ajuda */}
                        <p className="text-xs text-gray-500 mt-1 text-center">Clique para alterar</p>

                        {/* Botão de remover foto */}
                        {avatarUrl && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={removingAvatar || uploadingAvatar}
                                className="mt-2 flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {removingAvatar ? (
                                    <RefreshCw className="animate-spin" size={12} />
                                ) : (
                                    <Trash2 size={12} />
                                )}
                                {removingAvatar ? 'Removendo...' : 'Remover foto'}
                            </button>
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">Meu Perfil</h2>
                        <p className="text-sm text-gray-600">Gerencie suas informações pessoais e segurança da conta.</p>
                        <div className="mt-2 inline-flex items-center text-xs px-3 py-1 rounded-full bg-[#684A97]/10 text-[#684A97] font-medium uppercase tracking-wide">
                            {userType === 'admin' ? 'Administrador' : userType === 'teacher' ? 'Professor' : 'Usuário'}
                        </div>
                        {userType === "teacher" && (
                            <div className="mt-3 space-y-2">
                                <div className={`inline-flex items-center text-xs px-3 py-1 rounded-full border font-semibold ${verificationStatusStyle(verificationStatusState || null)}`}>
                                    Verificação: {verificationStatusText(verificationStatusState || null)}
                                </div>
                                {verificationStatusState === "rejected" && verificationReasonState && (
                                    <>
                                        <p className="text-xs text-red-700">Motivo: {verificationReasonState}</p>
                                        <p className="text-xs text-red-700">Resolva os pontos informados e salve o perfil para ser reavaliado.</p>
                                    </>
                                )}
                                {verificationStatusState !== "approved" && (
                                    <p className="text-xs text-gray-600">Enquanto sua conta estiver pendente/reprovada, você não poderá publicar artigos nem criar cursos/trilhas.</p>
                                )}
                                {reverificationNotice && (
                                    <p className="text-xs text-amber-700">{reverificationNotice}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Nome</label>
                        <div className="relative flex items-center">
                            <UserIcon className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu email" className={inputClass} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Alterar e-mail pode exigir confirmação.</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
                        <div className="relative flex items-center">
                            <Phone className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone / Celular" className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Endereço</label>
                        <div className="relative flex items-center">
                            <MapPin className="absolute left-4 text-[#6A4A98]" size={20} />
                            <Input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Cidade / Estado" className={inputClass} />
                        </div>
                    </div>
                    {userType === "teacher" && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Bio profissional</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    placeholder="Descreva sua experiência, áreas de atuação e metodologia."
                                    className="w-full rounded-2xl border border-gray-200 bg-[#F9F7FC] p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6A4A98]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Escolas onde leciona</label>
                                <div className="relative flex items-center">
                                    <School className="absolute left-4 text-[#6A4A98]" size={20} />
                                    <Input
                                        value={schoolsCsv}
                                        onChange={(e) => setSchoolsCsv(e.target.value)}
                                        placeholder="Ex: Escola Municipal A, Escola Estadual B"
                                        className={inputClass}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Separe cada escola com vírgula.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Grau de escolaridade</label>
                                <div className="relative flex items-center">
                                    <GraduationCap className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                                    <select
                                        value={educationLevel}
                                        onChange={(e) => setEducationLevel(e.target.value)}
                                        className="w-full rounded-full border-none bg-[#F3F0F9] py-4 pl-12 pr-4 text-gray-800 appearance-none cursor-pointer focus:ring-2 focus:ring-[#6A4A98] focus:ring-offset-2 focus:outline-none"
                                    >
                                        {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {educationLevel && (
                                    <p className="text-xs text-gray-500 mt-1">Selecionado: {educationLevelLabel(educationLevel)}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Formação</label>
                                <div className="relative flex items-center">
                                    <FileText className="absolute left-4 text-[#6A4A98]" size={20} />
                                    <Input
                                        value={degree}
                                        onChange={(e) => setDegree(e.target.value)}
                                        placeholder="Ex: Licenciatura em Matemática"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Especialidades</label>
                                <Input
                                    value={specialtiesCsv}
                                    onChange={(e) => setSpecialtiesCsv(e.target.value)}
                                    placeholder="Ex: Matemática, Geometria, ENEM"
                                    className="w-full rounded-full border-none bg-[#F3F0F9] py-6 px-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#6A4A98]"
                                />
                                <p className="text-xs text-gray-500 mt-1">Separe cada especialidade com vírgula.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Certificações</label>
                                <Input
                                    value={certificationsCsv}
                                    onChange={(e) => setCertificationsCsv(e.target.value)}
                                    placeholder="Ex: Pós-graduação em Educação, Certificação XYZ"
                                    className="w-full rounded-full border-none bg-[#F3F0F9] py-6 px-4 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#6A4A98]"
                                />
                                <p className="text-xs text-gray-500 mt-1">Separe cada certificação com vírgula.</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Comprovante de qualificação</label>
                                {qualificationDocumentUrl ? (
                                    <a
                                        href={qualificationDocumentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                                    >
                                        Abrir anexo atual
                                    </a>
                                ) : (
                                    <p className="text-xs text-amber-700">Nenhum anexo enviado.</p>
                                )}

                                <label className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F3F0F9] px-4 py-2 text-sm font-medium text-[#6A4A98] cursor-pointer hover:bg-[#ece5f8]">
                                    <Upload size={14} />
                                    {qualificationFile ? "Trocar anexo" : "Selecionar novo anexo"}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf,image/jpeg,image/png,image/webp"
                                        onChange={(e) => setQualificationFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                                {qualificationFile && (
                                    <p className="text-xs text-gray-600 mt-1 truncate">Arquivo selecionado: {qualificationFile.name}</p>
                                )}
                            </div>
                        </>
                    )}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={savingProfile || uploadingQualification} className="rounded-full bg-[#6A4A98] hover:bg-[#5a3e85]">
                            {(savingProfile || uploadingQualification) ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
                        </Button>
                    </div>
                </form>
            </section>
            {userType !== "admin" && (
                <section className="rounded-xl bg-white p-6 shadow-sm border">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">Excluir conta</h3>
                        <p className="text-sm text-gray-600">
                            A exclusão é permanente e remove seus dados pessoais. Seus conteúdos permanecerão publicados
                            de forma anônima.
                        </p>
                    </div>
                    <div className="mt-4">
                        <Button type="button" variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                            Excluir conta
                        </Button>
                    </div>
                </section>
            )}
            {deleteModalOpen && (
                <DeleteAccountModal
                    isTeacher={userType === "teacher"}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleDeleteAccount}
                    loading={deletingAccount}
                />
            )}
        </div>
    );
}
