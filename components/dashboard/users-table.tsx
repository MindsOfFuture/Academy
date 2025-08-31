import { deleteUserAction, getAllUsers, updateUserAction, UserProfile } from "../api/admApi";
import UsersTableClient from "./users-table-client";

export default async function UsersTable() {
    const data = await getAllUsers();

    return (
        <UsersTableClient users={data as UserProfile[]} deleteUserAction={deleteUserAction} updateUserAction={updateUserAction} />
    );
}

