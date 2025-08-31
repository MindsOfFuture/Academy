import { getAllUsers, UserProfile } from "../api/admApi";

export default async function UsersTable() {
    const data = await getAllUsers();
    return (
        <div>
            <div className="text-center sm:text-left mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <p className="text-gray-600 text-sm">Lista completa dos usuários cadastrados</p>
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-4xl">
                    {data.length > 0 ? (
                        <ul>
                            {data.map((u: UserProfile) => (
                                <li key={u.id} className="border-b py-2">
                                    {u.email} – {u.id} - {u.display_name}
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
