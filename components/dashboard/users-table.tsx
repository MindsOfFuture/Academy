"use client";

export default function UsersTable() {
    return (
        <div>
            <div className="text-center sm:text-left mb-4">
                <h2 className="text-xl font-semibold">Usuários</h2>
                <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>

            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow border p-6 w-full max-w-4xl">
                    <div className="h-48 border-2 border-dashed border-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500">Tabela de usuários</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
