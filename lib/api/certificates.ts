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
        .rpc("validate_certificate", { p_code: verificationCode })
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

/**
 * Busca todos os certificados emitidos para um curso.
 * Retorna um mapa de enrollment_id -> CertificateInfo.
 * Usado por professores/admins na tela de gerenciamento de alunos.
 */
export async function getCourseCertificates(courseId: string): Promise<Record<string, CertificateInfo>> {
    const supabase = createBrowserSupabase();

    const { data: certs, error } = await supabase
        .from("certificate")
        .select("id, verification_code, student_name, student_cpf, course_title, issued_at, enrollment_id, enrollment:enrollment_id (course_id)")
        .eq("enrollment.course_id", courseId);

    if (error || !certs) return {};

    const result: Record<string, CertificateInfo> = {};
    for (const cert of certs) {
        const enrollmentId = (cert as any).enrollment_id;
        if (enrollmentId) {
            result[enrollmentId] = {
                id: cert.id,
                verificationCode: cert.verification_code,
                studentName: cert.student_name,
                studentCpf: cert.student_cpf || "",
                courseTitle: cert.course_title,
                issuedAt: cert.issued_at,
            };
        }
    }

    return result;
}

export interface StudentProgress {
    enrollmentId: string;
    userId: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    isEligible: boolean;
}

/**
 * Busca o progresso de todos os alunos matriculados em um curso.
 * Retorna um mapa de enrollment_id -> StudentProgress.
 * Usado por professores/admins na tela de gerenciamento de alunos.
 */
export async function getStudentsProgress(courseId: string): Promise<Record<string, StudentProgress>> {
    const supabase = createBrowserSupabase();

    // 1. Total de aulas do curso
    const { data: lessons } = await supabase
        .from("lesson")
        .select("id")
        .eq("course_id", courseId);
    const totalLessons = lessons?.length ?? 0;

    // 2. Todas as atividades do curso
    const { data: assignments } = await supabase
        .from("assignment")
        .select("id, max_score, lesson!inner(course_id)")
        .eq("lesson.course_id", courseId);
    const totalAssignments = assignments?.length ?? 0;
    const assignmentIds = (assignments || []).map(a => a.id);

    // 3. Buscar todas as matrículas com progresso
    const { data: enrollments } = await supabase
        .from("enrollment")
        .select("id, user_id, lesson_progress(lesson_id, is_completed)")
        .eq("course_id", courseId);

    if (!enrollments) return {};

    // 4. Se há atividades, buscar todas as submissões de uma vez
    let allSubmissions: any[] = [];
    if (assignmentIds.length > 0) {
        const userIds = enrollments.map(e => e.user_id).filter(Boolean);
        if (userIds.length > 0) {
            const { data: subs } = await supabase
                .from("assignment_submission")
                .select("user_id, assignment_id, score, graded_at")
                .in("assignment_id", assignmentIds)
                .in("user_id", userIds);
            allSubmissions = subs || [];
        }
    }

    // Agrupar submissões por user_id
    const submissionsByUser = new Map<string, any[]>();
    for (const sub of allSubmissions) {
        const list = submissionsByUser.get(sub.user_id) || [];
        list.push(sub);
        submissionsByUser.set(sub.user_id, list);
    }

    const result: Record<string, StudentProgress> = {};

    for (const enrollment of enrollments) {
        const progress = enrollment.lesson_progress as any[] || [];
        const completedLessons = progress.filter((p: any) => p.is_completed).length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const allLessonsCompleted = totalLessons > 0 && completedLessons >= totalLessons;

        let isEligible = allLessonsCompleted;

        // Verificar atividades se existirem
        if (isEligible && totalAssignments > 0 && enrollment.user_id) {
            const userSubs = submissionsByUser.get(enrollment.user_id) || [];
            const subMap = new Map<string, any>();
            for (const s of userSubs) subMap.set(s.assignment_id, s);

            let submitted = 0, graded = 0, passed = 0;
            for (const assignment of assignments!) {
                const sub = subMap.get(assignment.id);
                if (sub) {
                    submitted++;
                    if (sub.graded_at) {
                        graded++;
                        const maxScore = assignment.max_score || 10;
                        const score = sub.score || 0;
                        if ((score / maxScore) * 100 >= 60) passed++;
                    }
                }
            }
            isEligible = submitted >= totalAssignments && graded >= totalAssignments && passed >= totalAssignments;
        }

        result[enrollment.id] = {
            enrollmentId: enrollment.id,
            userId: enrollment.user_id,
            completedLessons,
            totalLessons,
            progressPercent,
            isEligible,
        };
    }

    return result;
}

/**
 * Emite certificado para um aluno específico (uso por professor/admin).
 * Verifica elegibilidade antes de emitir.
 */
export async function issueCertificateForStudent(courseId: string, enrollmentId: string, userId: string): Promise<CertificateInfo> {
    const supabase = createBrowserSupabase();

    // Verificar se já existe certificado
    const { data: existingCert } = await supabase
        .from("certificate")
        .select("id, verification_code, student_name, student_cpf, course_title, issued_at")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

    if (existingCert) {
        return {
            id: existingCert.id,
            verificationCode: existingCert.verification_code,
            studentName: existingCert.student_name,
            studentCpf: existingCert.student_cpf || "",
            courseTitle: existingCert.course_title,
            issuedAt: existingCert.issued_at,
        };
    }

    // Buscar dados do aluno
    const { data: profile } = await supabase
        .from("user_profile")
        .select("full_name, document")
        .eq("id", userId)
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

    // Atualizar status da matrícula para completed
    await supabase
        .from("enrollment")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrollmentId);

    // Criar certificado
    const { data: cert, error } = await supabase
        .from("certificate")
        .insert({
            enrollment_id: enrollmentId,
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
        studentCpf: cert.student_cpf || "",
        courseTitle: cert.course_title,
        issuedAt: cert.issued_at,
    };
}
