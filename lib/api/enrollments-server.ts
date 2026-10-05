"use server";

import { createClient } from "@/lib/supabase/server";
import { type EnrollmentSummary } from "./types";
import { readUserCourses } from "./enrollments-read-server";

export async function getUserCoursesServer(): Promise<EnrollmentSummary[]> {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return [];

    return readUserCourses(supabase, user.id);
}
