import { createAdminClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js"; // Importa tipo User

export default async function UsersTable() {
    const supabase = await createAdminClient();

    const { data, error } = await supabase.auth.admin.listUsers();
    const users: User[] = data?.users ?? [];

    if (error) {
        console.error("Erro ao listar usuários:", error.message);
    }

    return (
        <div>
            <div className="text-center sm:text-left mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-4xl">
                    {users.length > 0 ? (
                        <ul>
                            {users.map((u: User) => (
                                <li key={u.id} className="border-b py-2">
                                    {u.email} – {u.id}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-48 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500">Nenhum usuário encontrado</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
