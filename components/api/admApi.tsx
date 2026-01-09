// Mantido para compatibilidade; agora reexporta helpers alinhados ao novo esquema do Supabase.
export {
    getUserTypeServer,
    getAllUsers,
    deleteUserAction,
    updateUserAction,
    getUsersPage,
    getCurrentUserProfile,
    updateCurrentUserProfileAction,
} from "@/lib/api/profiles-server";

export { updateUserProfileClient } from "@/lib/api/profiles";

export type { UserProfileSummary as UserProfile } from "@/lib/api/types";