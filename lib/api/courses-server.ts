"use server";

import { createClient } from "@/lib/supabase/server";
import { type CourseSummary, type CourseRow, mapCourse } from "./types";

export async function listCoursesServer(): Promise<CourseSummary[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("course")
        .select(`
            id, 
            title, 
            description, 
            level, 
            status, 
            audience, 
            thumb:media_file!course_thumb_id_fkey(url),
            enrollments:enrollment(count)
        `)
        .eq("status", "active");

    if (error || !data) return [];
    
    const mapped = data.map((row: any) => ({
        ...mapCourse(row as unknown as CourseRow),
        enrollmentCount: row.enrollments?.[0]?.count ?? 0
    }));

    return mapped.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
}

