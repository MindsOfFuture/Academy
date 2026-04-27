"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type UserProfileSummary } from "@/lib/api/types";

interface TeacherVerificationModalProps {
    user: UserProfileSummary;
    onClose: () => void;
    onSubmit: (params: { userId: string; status: "approved" | "rejected"; reason?: string }) => Promise<void>;
}

export default function TeacherVerificationModal({ user, onClose, onSubmit }: TeacherVerificationModalProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    async function handleApprove() {
        if (!user.verificationDocumentUrl) {
            alert("Este professor ainda não enviou o comprovante de qualificação.");
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ userId: user.id, status: "approved" });
            onClose();
        } finally {
            setLoading(false);
        }
    }

    async function handleReject() {
        if (!reason.trim()) {
            alert("Informe um motivo para reprovar.");
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ userId: user.id, status: "rejected", reason });
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold">Verificação de Professor</h3>
                <p className="text-sm text-gray-600 mt-2">
                    Professor: <span className="font-medium">{user.fullName || user.email}</span>
                </p>
                <p className="text-sm text-gray-600">Email: {user.email}</p>
                {user.phone && <p className="text-sm text-gray-600">Telefone: {user.phone}</p>}
                {user.address && <p className="text-sm text-gray-600">Endereço: {user.address}</p>}
                
                {(user.educationLevel || user.degree || (user.schools && user.schools.length > 0)) && (
                    <div className="mt-4 rounded-md border border-gray-200 p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Informações Acadêmicas</p>
                        {user.educationLevel && <p className="text-sm text-gray-600">Nível de Ensino: {user.educationLevel}</p>}
                        {user.degree && <p className="text-sm text-gray-600">Formação: {user.degree}</p>}
                        {user.schools && user.schools.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                                <p>Escolas de Atuação:</p>
                                <ul className="list-disc list-inside ml-2">
                                    {user.schools.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">Comprovante de qualificação</p>
                    {user.verificationDocumentUrl ? (
                        <a
                            href={user.verificationDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                        >
                            Abrir anexo enviado pelo professor
                        </a>
                    ) : (
                        <p className="text-sm text-red-600">Nenhum anexo enviado.</p>
                    )}
                </div>

                <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Motivo da reprovação</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Explique o que precisa ser ajustado para aprovação."
                        className="w-full rounded-md border border-gray-300 p-3 text-sm"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="button" onClick={handleReject} disabled={loading} variant="destructive">
                        {loading ? "Enviando..." : "Reprovar"}
                    </Button>
                    <Button type="button" onClick={handleApprove} disabled={loading || !user.verificationDocumentUrl}>
                        {loading ? "Enviando..." : "Aprovar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
