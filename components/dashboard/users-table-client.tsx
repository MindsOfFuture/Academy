"use client";
// UsersTableClient: controla paginação, pesquisa, edição e exclusão de usuários no lado do cliente.
// Arquitetura:
//  - Estado inicial vindo do server (SSR) para melhor performance.
//  - Paginação e busca executadas diretamente via Supabase client (evita rotas extras).
//  - Debounce de 400ms reduz chamadas enquanto digitação ocorre.
//  - Modal separado para edição e confirmação de exclusão.
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { type UserProfileSummary } from "@/lib/api/types";
import { UsersSearch } from "./users-search";
import { UsersPagination } from "./users-pagination";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteConfirmModal } from "./user-delete-confirm-modal";
import TeacherVerificationModal from "./teacher-verification-modal";

interface UsersTableClientProps {
    initialUsers: UserProfileSummary[];
    initialTotal: number;
    initialPage: number;
    initialPageSize: number;
    deleteUserAction: (formData: FormData) => Promise<void>;
    updateUserAction: (formData: FormData) => Promise<void>;
}

export default function UsersTableClient({ initialUsers, initialTotal, initialPage, initialPageSize, deleteUserAction, updateUserAction }: UsersTableClientProps) {

    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfileSummary | null>(null);
    const [users, setUsers] = useState<UserProfileSummary[]>(initialUsers);
    const [total, setTotal] = useState<number>(initialTotal);
    const [page, setPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    const [pageLoading, setPageLoading] = useState(false);
    const [search, setSearch] = useState("");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserProfileSummary | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [verificationUser, setVerificationUser] = useState<UserProfileSummary | null>(null);

    function verificationStatusLabel(status: UserProfileSummary["verificationStatus"]) {
        if (status === "approved") return "Aprovado";
        if (status === "rejected") return "Reprovado";
        if (status === "pending") return "Pendente";
        return "N/A";
    }

    function verificationStatusClass(status: UserProfileSummary["verificationStatus"]) {
        if (status === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
        if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
        if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-gray-100 text-gray-600 border-gray-200";
    }

    function mapRole(userId: string, links: Array<{ user_profile_id: string; role?: { name?: string | null } | { name?: string | null }[] | null }>): import("@/lib/api/types").RoleName {
        const link = links.find((item) => item.user_profile_id === userId);
        const roleField = link?.role;
        const name = Array.isArray(roleField) ? roleField[0]?.name : roleField?.name;
        if (name === "admin" || name === "teacher" || name === "student") return name;
        return "student";
    }

    // Carrega uma página de usuários considerando parâmetros opcionais de tamanho e termo de busca.
    // Aplica sanidade e calcula range baseado em página (1-based).
    async function loadPage(target: number, newSize?: number, overrideSearch?: string, overrideStatus?: typeof statusFilter) {
        setPageLoading(true);
        try {
            const size = newSize ?? pageSize;
            const supabase = createClient();
            const safeSize = Math.min(Math.max(size, 1), 100);
            const safePage = Math.max(target, 1);
            const from = (safePage - 1) * safeSize;
            const to = from + safeSize - 1;
            const term = (overrideSearch ?? search).trim();
            const selectedStatus = overrideStatus ?? statusFilter;
            let query = supabase
                .from('user_profile')
                .select('id, full_name, email, avatar_url, bio, phone, address, specialties, certifications, verification_status, is_active', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (term) {
                const cleaned = term.replace(/%/g, '').replace(/\s+/g, ' ');
                const pattern = `%${cleaned}%`;
                query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
            }

            if (selectedStatus !== "all") {
                query = query.eq("verification_status", selectedStatus);
            }

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            const ids = (data || []).map((u) => u.id);
            const { data: roleLinks } = await supabase
                .from('user_role')
                .select('user_profile_id, role:role_id(name)')
                .in('user_profile_id', ids);

            const { data: teacherRequests } = await supabase
                .from("teacher_request")
                .select("user_id, status, observations, qualification_document_url, created_at")
                .in("user_id", ids);

            const { data: teacherDetails } = await supabase
                .from("teacher_details")
                .select("user_id, schools, education_level, degree")
                .in("user_id", ids);

            const teacherDetailsByUser = new Map<string, {
                schools?: string[] | null;
                education_level?: string | null;
                degree?: string | null;
            }>();

            (teacherDetails || []).forEach((row) => {
                teacherDetailsByUser.set(row.user_id, row);
            });

            const latestTeacherRequestByUser = new Map<string, {
                status?: string | null;
                observations?: string | null;
                qualification_document_url?: string | null;
                created_at?: string | null;
            }>();

            (teacherRequests || []).forEach((row) => {
                const current = latestTeacherRequestByUser.get(row.user_id);
                const rowDate = new Date(row.created_at || 0).getTime();
                const currentDate = new Date(current?.created_at || 0).getTime();
                if (!current || rowDate >= currentDate) {
                    latestTeacherRequestByUser.set(row.user_id, row);
                }
            });

            const mapped = (data || []).map((row) => {
                const latestTeacherRequest = latestTeacherRequestByUser.get(row.id);
                const td = teacherDetailsByUser.get(row.id);
                return {
                    id: row.id,
                    email: row.email,
                    fullName: row.full_name,
                    avatarUrl: row.avatar_url,
                    bio: row.bio,
                    phone: row.phone,
                    address: row.address,
                    specialties: row.specialties || [],
                    certifications: row.certifications || [],
                    verificationStatus: row.verification_status || null,
                    verificationReason: latestTeacherRequest?.status === "rejected" ? latestTeacherRequest?.observations || null : null,
                    verificationDocumentUrl: latestTeacherRequest?.qualification_document_url || null,
                    isActive: row.is_active,
                    role: mapRole(row.id, roleLinks || []),
                    schools: td?.schools || [],
                    educationLevel: td?.education_level || null,
                    degree: td?.degree || null,
                };
            });

            setUsers(mapped);
            setTotal(count || 0);
            setPage(safePage);
            setPageSize(safeSize);
        } catch (e) {
            console.error('Falha ao carregar página de usuários', e);
        } finally {
            setPageLoading(false);
        }
    }

    // Debounce da pesquisa para evitar requisições a cada tecla.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadPage(1, undefined, search, statusFilter); // reset para página 1 quando pesquisa mudar
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    function onEdit(u: UserProfileSummary) { setEditingUser(u); setOpen(true); }
    function close() { setOpen(false); setEditingUser(null); }
    function onAskDelete(u: UserProfileSummary) { setDeletingUser(u); setDeleteOpen(true); }
    function closeDelete() { setDeletingUser(null); setDeleteOpen(false); }

    // Após excluir usuário, recalcula página alvo (se última ficou vazia, volta uma página).
    async function handleDelete(formData: FormData) {
        await deleteUserAction(formData); // server action
        closeDelete();
        // Recarrega página atual (ou anterior se ficou vazia)
        const afterCount = total - 1;
        const lastPageAfter = Math.max(1, Math.ceil(afterCount / pageSize));
        const targetPage = Math.min(page, lastPageAfter);
        loadPage(targetPage, undefined, undefined, statusFilter);
    }

    async function handleTeacherVerification(params: { userId: string; status: "approved" | "rejected"; reason?: string }) {
        const response = await fetch("/api/admin/teacher-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.error || "Falha ao atualizar verificação do professor");
        }

        await loadPage(page, undefined, undefined, statusFilter);
    }

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">Usuários</h2>
                    <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full mb-4">
                <div className="flex-1">
                    <UsersSearch value={search} onChange={setSearch} />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        const nextValue = e.target.value as typeof statusFilter;
                        setStatusFilter(nextValue);
                        loadPage(1, undefined, search, nextValue);
                    }}
                    className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="pending">Professores pendentes</option>
                    <option value="approved">Professores aprovados</option>
                    <option value="rejected">Professores reprovados</option>
                </select>
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-4 sm:p-6 w-full max-w-[100%]">
                    {users.length > 0 ? (
                        <>
                            {/* Visão tabela (md e acima) */}
                            <div className="hidden md:block">
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <table className="min-w-full table-auto">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide">Email</th>
                                                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide">Nome</th>
                                                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide">Tipo</th>
                                                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide">Verificação</th>
                                                <th className="text-center py-2 px-4 text-xs font-semibold uppercase tracking-wide">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 px-4 text-sm break-all max-w-xs">{u.email}</td>
                                                    <td className="py-2 px-4 text-sm">{u.fullName || u.email}</td>
                                                    <td className="py-2 px-4 text-sm">{u.role}</td>
                                                    <td className="py-2 px-4 text-sm">
                                                        {u.role === "teacher" ? (
                                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${verificationStatusClass(u.verificationStatus)}`}>
                                                                {verificationStatusLabel(u.verificationStatus)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <div className="flex flex-col items-center gap-1 lg:flex-row lg:justify-center">
                                                            <Button variant="destructive" size="sm" onClick={() => onAskDelete(u)}>Apagar</Button>
                                                            <Button variant="outline" size="sm" onClick={() => onEdit(u)}>Editar</Button>
                                                            {u.role === "teacher" && (
                                                                <Button variant="secondary" size="sm" onClick={() => {
                                                                    setVerificationUser(u);
                                                                    setVerificationModalOpen(true);
                                                                }}>
                                                                    Verificar
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Visão cards (mobile) */}
                            <ul className="md:hidden space-y-3">
                                {users.map(u => (
                                    <li key={u.id} className="border rounded-lg p-4 shadow-sm bg-white">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Email</p>
                                                <p className="text-sm font-medium break-all">{u.email}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-6">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Nome</p>
                                                    <p className="text-sm">{u.fullName || u.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Tipo</p>
                                                    <p className="text-sm">{u.role}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Verificação</p>
                                                    <p className="text-sm">{u.role === "teacher" ? verificationStatusLabel(u.verificationStatus) : "-"}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2 flex flex-wrap gap-2">
                                                <Button variant="destructive" size="sm" onClick={() => onAskDelete(u)}>Apagar</Button>
                                                <Button variant="outline" size="sm" onClick={() => onEdit(u)}>Editar</Button>
                                                {u.role === "teacher" && (
                                                    <Button variant="secondary" size="sm" onClick={() => {
                                                        setVerificationUser(u);
                                                        setVerificationModalOpen(true);
                                                    }}>
                                                        Verificar
                                                    </Button>
                                                )}
                                            </div>
                                            {u.role === "teacher" && u.verificationStatus === "rejected" && u.verificationReason && (
                                                <p className="text-xs text-red-700">Motivo: {u.verificationReason}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className="h-48 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500">Nenhum usuário encontrado</span>
                        </div>
                    )}
                    <UsersPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={pageSize}
                        loading={pageLoading}
                        canPrev={canPrev}
                        canNext={canNext}
                        filtered={!!search}
                        onChangePage={(p) => loadPage(p)}
                        onChangePageSize={(s) => loadPage(1, s)}
                    />
                </div>
            </div>
            {open && editingUser && (
                <UserEditModal user={editingUser} onClose={close} updateUserAction={updateUserAction} />
            )}
            {deleteOpen && deletingUser && (
                <UserDeleteConfirmModal user={deletingUser} onClose={closeDelete} onConfirm={handleDelete} />
            )}
            {verificationModalOpen && verificationUser && (
                <TeacherVerificationModal
                    user={verificationUser}
                    onClose={() => {
                        setVerificationModalOpen(false);
                        setVerificationUser(null);
                    }}
                    onSubmit={handleTeacherVerification}
                />
            )}
        </div>
    );
}
