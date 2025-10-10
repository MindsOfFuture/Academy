import { deleteUserAction, getUsersPage, updateUserAction, UserProfile } from "../api/admApi";
import UsersTableClient from "./users-table-client";

// Componente server-side que busca a primeira página de usuários.
// Fornece dados iniciais para hidratação do componente client sem flash vazio.

export default async function UsersTable() {
    const { users, total, page, pageSize } = await getUsersPage(1, 10);

    return (
        <UsersTableClient
            initialUsers={users as UserProfile[]}
            initialTotal={total}
            initialPage={page}
            initialPageSize={pageSize}
            deleteUserAction={deleteUserAction}
            updateUserAction={updateUserAction}
        />
    );
}

