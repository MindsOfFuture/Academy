"use client";
// UsersTableClient: controla paginação, pesquisa, edição e exclusão de usuários no lado do cliente.
// Arquitetura:
//  - Estado inicial vindo do server (SSR) para melhor performance.
//  - Paginação e busca executadas diretamente via Supabase client (evita rotas extras).
//  - Debounce de 400ms reduz chamadas enquanto digitação ocorre.
//  - Modal separado para edição e confirmação de exclusão.
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "../api/admApi";
import { createClient } from "@/lib/supabase/client";
import { UsersSearch } from "./users-search";
import { UsersPagination } from "./users-pagination";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteConfirmModal } from "./user-delete-confirm-modal";

interface UsersTableClientProps {
    initialUsers: UserProfile[];
    initialTotal: number;
    initialPage: number;
    initialPageSize: number;
    deleteUserAction: (formData: FormData) => Promise<void>;
    updateUserAction: (formData: FormData) => Promise<void>;
}

export default function UsersTableClient({ initialUsers, initialTotal, initialPage, initialPageSize, deleteUserAction, updateUserAction }: UsersTableClientProps) {

    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [total, setTotal] = useState<number>(initialTotal);
    const [page, setPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    const [pageLoading, setPageLoading] = useState(false);
    const [search, setSearch] = useState("");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

    // Carrega uma página de usuários considerando parâmetros opcionais de tamanho e termo de busca.
    // Aplica sanidade e calcula range baseado em página (1-based).
    async function loadPage(target: number, newSize?: number, overrideSearch?: string) {
        setPageLoading(true);
        try {
            const size = newSize ?? pageSize;
            const supabase = createClient();
            const safeSize = Math.min(Math.max(size, 1), 100);
            const safePage = Math.max(target, 1);
            const from = (safePage - 1) * safeSize;
            const to = from + safeSize - 1;
            const term = (overrideSearch ?? search).trim();
            let query = supabase
                .from('users')
                .select('*', { count: 'exact' });

            if (term) {
                // Sanitização básica removendo % e normalizando espaços. Busca parcial com ilike.
                const cleaned = term.replace(/%/g, '').replace(/\s+/g, ' ');
                const pattern = `%${cleaned}%`;
                query = query.or(`display_name.ilike.${pattern},email.ilike.${pattern}`);
            }

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;
            setUsers(data || []);
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
            loadPage(1, undefined, search); // reset para página 1 quando pesquisa mudar
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    function onEdit(u: UserProfile) { setEditingUser(u); setOpen(true); }
    function close() { setOpen(false); setEditingUser(null); }
    function onAskDelete(u: UserProfile) { setDeletingUser(u); setDeleteOpen(true); }
    function closeDelete() { setDeletingUser(null); setDeleteOpen(false); }

    // Após excluir usuário, recalcula página alvo (se última ficou vazia, volta uma página).
    async function handleDelete(formData: FormData) {
        await deleteUserAction(formData); // server action
        closeDelete();
        // Recarrega página atual (ou anterior se ficou vazia)
        const afterCount = total - 1;
        const lastPageAfter = Math.max(1, Math.ceil(afterCount / pageSize));
        const targetPage = Math.min(page, lastPageAfter);
        loadPage(targetPage);
    }

    return (
        <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">Usuários</h2>
                    <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
                </div>
            </div>
            <div className="flex justify-center items-center w-full mb-4">
                <UsersSearch value={search} onChange={setSearch} />
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-[100%]">
                    {users.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">Email</th>
                                    <th className="text-left py-2 px-4">Nome</th>
                                    <th className="text-left py-2 px-4">Tipo</th>
                                    <th className="text-center py-2 px-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="py-2 px-4 text-sm break-all">{u.email}</td>
                                        <td className="py-2 px-4 text-sm">{u.display_name}</td>
                                        <td className="py-2 px-4 text-sm">{u.type}</td>
                                        <td className="py-2 px-4 text-center space-y-1">
                                            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                                                <Button variant="destructive" size="sm" onClick={() => onAskDelete(u)}>Apagar</Button>
                                                <Button variant="outline" size="sm" onClick={() => onEdit(u)}>Editar</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
        </div>
    );
}
