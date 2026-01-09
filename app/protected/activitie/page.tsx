"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Activities from "@/components/activities/activities";
import Navbar from "@/components/navbar/navbar";
import { getAssignment } from "@/lib/api/assignments";
import { type AssignmentSummary, type SubmissionSummary } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";

function ActivitiePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentId = searchParams.get("id");

  const [assignment, setAssignment] = useState<AssignmentSummary | null>(null);
  const [submission, setSubmission] = useState<SubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Professor");
  const [teacherLink] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!assignmentId) {
        setLoading(false);
        return;
      }

      try {
        const assignmentData = await getAssignment(assignmentId);
        if (assignmentData) {
          setAssignment(assignmentData);

          // Buscar informações adicionais (professor, submissão existente)
          const supabase = createClient();

          // Buscar submissão do aluno
          const { data: submissionData } = await supabase
            .from("assignment_submission")
            .select("*")
            .eq("assignment_id", assignmentId)
            .maybeSingle();

          if (submissionData) {
            setSubmission({
              id: submissionData.id,
              assignmentId: submissionData.assignment_id,
              enrollmentId: submissionData.enrollment_id ?? null,
              userId: submissionData.user_id ?? null,
              submittedAt: submissionData.submitted_at ?? null,
              answerUrl: submissionData.answer_url ?? null,
              contentUrl: submissionData.content_url ?? null,
              comments: submissionData.comments ?? null,
              score: submissionData.score ?? null,
              feedback: submissionData.feedback ?? null,
              gradedAt: submissionData.graded_at ?? null,
            });
          }

          // Buscar nome do professor criador
          if (assignmentData.id) {
            const { data: creatorData } = await supabase
              .from("assignment")
              .select("created_by, user_profile!assignment_created_by_fkey(full_name)")
              .eq("id", assignmentId)
              .single();

            if (creatorData?.user_profile) {
              const profile = Array.isArray(creatorData.user_profile)
                ? creatorData.user_profile[0]
                : creatorData.user_profile;
              if (profile?.full_name) {
                setTeacherName(profile.full_name);
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar atividade:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar showTextLogo={true} />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar showTextLogo={true} />
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <p className="text-gray-600">Atividade não encontrada.</p>
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar showTextLogo={true} />
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-800 mb-4"
        >
          ← Voltar
        </button>
      </div>
      <div className="flex justify-center items-center w-full">
        <Activities
          teacherLink={teacherLink}
          studentLink={submission?.contentUrl || submission?.answerUrl || ""}
          title={assignment.title}
          description={assignment.description || ""}
          date={assignment.createdAt || undefined}
          score={assignment.maxScore || 10}
          studentScore={submission?.score || 0}
          teacherName={teacherName}
          deliveryDate={assignment.dueDate || undefined}
          teacherTitleLink="Material do Professor"
          studentTitleLink={submission ? "Sua Entrega" : "Enviar Trabalho"}
        />
      </div>
    </div>
  );
}

export default function ActivitiePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <ActivitiePageContent />
    </Suspense>
  );
}
