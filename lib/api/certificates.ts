import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

export interface CourseCompletionStatus {
    isCompleted: boolean;
    allLessonsCompleted: boolean;
    allAssignmentsSubmitted: boolean;
    allAssignmentsGraded: boolean;
    allAssignmentsPassed: boolean;
    totalLessons: number;
    completedLessons: number;
    totalAssignments: number;
    submittedAssignments: number;
    gradedAssignments: number;
    passedAssignments: number;
    failedAssignments: { title: string; score: number; maxScore: number }[];
}

export interface CertificateInfo {
    id: string;
    verificationCode: string;
    studentName: string;
    studentCpf: string;
    courseTitle: string;
    issuedAt: string;
}

/**
 * Verifica se o aluno concluiu o curso com todas as condições:
 * 1. Todas as aulas concluídas (100% progresso)
 * 2. Todas as atividades enviadas
 * 3. Todas as atividades corrigidas
 * 4. Todas com nota >= 60%
 */
export async function checkCourseCompletion(courseId: string): Promise<CourseCompletionStatus> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    // 1. Buscar enrollment
    const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!enrollment) throw new Error("Usuário não matriculado neste curso.");

    // 2. Buscar total de aulas do curso
    const { data: lessons } = await supabase
        .from("lesson")
        .select("id")
        .eq("course_id", courseId);

    const totalLessons = lessons?.length ?? 0;

    // 3. Buscar aulas concluídas
    const { data: completedProgress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("enrollment_id", enrollment.id)
        .eq("is_completed", true);

    const completedLessons = completedProgress?.length ?? 0;
    const allLessonsCompleted = totalLessons > 0 && completedLessons >= totalLessons;

    // 4. Buscar todas as atividades do curso
    const { data: assignments } = await supabase
        .from("assignment")
        .select("id, title, max_score, lesson!inner(course_id)")
        .eq("lesson.course_id", courseId);

    const totalAssignments = assignments?.length ?? 0;

    // 5. Se não há atividades, basta concluir as aulas
    if (totalAssignments === 0) {
        return {
            isCompleted: allLessonsCompleted,
            allLessonsCompleted,
            allAssignmentsSubmitted: true,
            allAssignmentsGraded: true,
            allAssignmentsPassed: true,
            totalLessons,
            completedLessons,
            totalAssignments: 0,
            submittedAssignments: 0,
            gradedAssignments: 0,
            passedAssignments: 0,
            failedAssignments: [],
        };
    }

    // 6. Buscar submissões do aluno para essas atividades
    const assignmentIds = assignments!.map(a => a.id);
    const { data: submissions } = await supabase
        .from("assignment_submission")
        .select("assignment_id, score, graded_at")
        .in("assignment_id", assignmentIds)
        .eq("user_id", user.id);

    const submissionMap = new Map<string, { score: number | null; gradedAt: string | null }>();
    for (const sub of (submissions || [])) {
        submissionMap.set(sub.assignment_id, {
            score: sub.score,
            gradedAt: sub.graded_at,
        });
    }

    let submittedAssignments = 0;
    let gradedAssignments = 0;
    let passedAssignments = 0;
    const failedAssignments: { title: string; score: number; maxScore: number }[] = [];

    for (const assignment of assignments!) {
        const sub = submissionMap.get(assignment.id);
        if (sub) {
            submittedAssignments++;
            if (sub.gradedAt) {
                gradedAssignments++;
                const maxScore = assignment.max_score || 10;
                const score = sub.score || 0;
                const percentage = (score / maxScore) * 100;
                if (percentage >= 60) {
                    passedAssignments++;
                } else {
                    failedAssignments.push({
                        title: assignment.title,
                        score,
                        maxScore,
                    });
                }
            }
        }
    }

    const allAssignmentsSubmitted = submittedAssignments >= totalAssignments;
    const allAssignmentsGraded = gradedAssignments >= totalAssignments;
    const allAssignmentsPassed = passedAssignments >= totalAssignments;

    const isCompleted = allLessonsCompleted && allAssignmentsSubmitted && allAssignmentsGraded && allAssignmentsPassed;

    return {
        isCompleted,
        allLessonsCompleted,
        allAssignmentsSubmitted,
        allAssignmentsGraded,
        allAssignmentsPassed,
        totalLessons,
        completedLessons,
        totalAssignments,
        submittedAssignments,
        gradedAssignments,
        passedAssignments,
        failedAssignments,
    };
}

/**
 * Busca certificado existente para o curso.
 */
export async function getExistingCertificate(courseId: string): Promise<CertificateInfo | null> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;

    const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!enrollment) return null;

    const { data: cert } = await supabase
        .from("certificate")
        .select("id, verification_code, student_name, student_cpf, course_title, issued_at")
        .eq("enrollment_id", enrollment.id)
        .maybeSingle();

    if (!cert) return null;

    return {
        id: cert.id,
        verificationCode: cert.verification_code,
        studentName: cert.student_name,
        studentCpf: cert.student_cpf,
        courseTitle: cert.course_title,
        issuedAt: cert.issued_at,
    };
}

/**
 * Emite o certificado: verifica condições, cria o registro e retorna os dados.
 */
export async function issueCertificate(courseId: string): Promise<CertificateInfo> {
    const supabase = createBrowserSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) throw new Error("Usuário não autenticado.");

    // Verificar se já existe certificado
    const existing = await getExistingCertificate(courseId);
    if (existing) return existing;

    // Verificar conclusão
    const status = await checkCourseCompletion(courseId);
    if (!status.isCompleted) {
        throw new Error("Curso não concluído. Verifique se todas as aulas e atividades estão finalizadas com nota superior a 60%.");
    }

    // Buscar dados do aluno
    const { data: profile } = await supabase
        .from("user_profile")
        .select("full_name, document")
        .eq("id", user.id)
        .maybeSingle();

    const studentName = profile?.full_name || "Aluno";
    const studentCpf = profile?.document || "";

    // Buscar dados do curso
    const { data: course } = await supabase
        .from("course")
        .select("title")
        .eq("id", courseId)
        .maybeSingle();

    const courseTitle = course?.title || "Curso";

    // Buscar enrollment
    const { data: enrollment } = await supabase
        .from("enrollment")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!enrollment) throw new Error("Matrícula não encontrada.");

    // Atualizar status da matrícula para completed
    await supabase
        .from("enrollment")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrollment.id);

    // Criar certificado (verification_code é gerado automaticamente pelo trigger)
    const { data: cert, error } = await supabase
        .from("certificate")
        .insert({
            enrollment_id: enrollment.id,
            student_name: studentName,
            student_cpf: studentCpf,
            course_title: courseTitle,
        })
        .select("id, verification_code, student_name, student_cpf, course_title, issued_at")
        .single();

    if (error) throw error;

    return {
        id: cert.id,
        verificationCode: cert.verification_code,
        studentName: cert.student_name,
        studentCpf: cert.student_cpf,
        courseTitle: cert.course_title,
        issuedAt: cert.issued_at,
    };
}

/**
 * Valida um certificado pelo código de verificação. 
 * Pode ser usado sem autenticação (página pública).
 */
export async function validateCertificate(verificationCode: string): Promise<CertificateInfo | null> {
    const supabase = createBrowserSupabase();

    const { data: cert } = await supabase
        .from("certificate")
        .select("id, verification_code, student_name, student_cpf, course_title, issued_at")
        .eq("verification_code", verificationCode.trim().toUpperCase())
        .maybeSingle();

    if (!cert) return null;

    return {
        id: cert.id,
        verificationCode: cert.verification_code,
        studentName: cert.student_name,
        studentCpf: cert.student_cpf || "",
        courseTitle: cert.course_title,
        issuedAt: cert.issued_at,
    };
}
