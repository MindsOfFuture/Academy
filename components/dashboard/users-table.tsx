import { getAllUsers, UserProfile } from "../api/admApi";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

export default async function UsersTable() {
    const data = await getAllUsers();

    async function deleteUserAction(formData: FormData) {
        'use server';
        const id = formData.get('id') as string | null;
        if (!id) return;
        const supabase = await createAdminClient();
        await supabase.auth.admin.deleteUser(id);
        revalidatePath('/protected');
    }

    return (
        <div>
            <div className="text-center sm:text-left mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
            </div>
            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-4xl">
                    {data.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">Email</th>
                                    <th className="text-left py-2 px-4">Nome</th>
                                    <th className="text-center py-2 px-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((u: UserProfile) => (
                                    <tr key={u.id} className="border-b">
                                        <td className="py-2 px-4 text-sm break-all">{u.email}</td>
                                        <td className="py-2 px-4 text-sm">{u.display_name}</td>
                                        <td className="py-2 px-4 text-center">
                                            <form action={deleteUserAction}>
                                                <input type="hidden" name="id" value={u.id} />
                                                <Button variant="destructive" size="sm">Apagar</Button>
                                            </form>
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
                </div>
            </div>
        </div>
    );
}

