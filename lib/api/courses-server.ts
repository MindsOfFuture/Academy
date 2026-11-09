"use server";

import { createClient } from "@/lib/supabase/server";
import { consultarCursosAtivos } from "./content";
import { type CourseSummary } from "./types";

export async function listCoursesServer(): Promise<CourseSummary[]> {
    return consultarCursosAtivos(await createClient());
}

