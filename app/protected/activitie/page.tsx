"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import { 
  getAssignment, 
  getUserSubmission, 
  submitAssignment, 
  updateSubmission, 
  deleteSubmission 
} from "@/lib/api/assignments";
import { type AssignmentSummary, type SubmissionSummary } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { 
  FileText, 
  Clock, 
  Award, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Link2,
  MessageSquare,
  User
} from "lucide-react";

function ActivitiePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentId = searchParams.get("id");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignment, setAssignment] = useState<AssignmentSummary | null>(null);
  const [submission, setSubmission] = useState<SubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacherName, setTeacherName] = useState("Professor");
  const [lessonTitle, setLessonTitle] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  // Form states
  const [answerUrl, setAnswerUrl] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!assignmentId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar atividade
        const assignmentData = await getAssignment(assignmentId);
        if (assignmentData) {
          setAssignment(assignmentData);

          // Buscar submissão existente
          const existingSubmission = await getUserSubmission(assignmentId);
          if (existingSubmission) {
            setSubmission(existingSubmission);
            setAnswerUrl(existingSubmission.answerUrl || existingSubmission.contentUrl || "");
            setComments(existingSubmission.comments || "");
          }

          // Buscar informações adicionais
          const supabase = createClient();

          // Buscar nome do professor
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

          // Buscar título da aula e curso
          const { data: lessonData } = await supabase
            .from("lesson")
            .select("title, course(title)")
            .eq("id", assignmentData.lessonId)
            .single();

          if (lessonData) {
            setLessonTitle(lessonData.title);
            if (lessonData.course) {
              const course = Array.isArray(lessonData.course) 
                ? lessonData.course[0] 
                : lessonData.course;
              setCourseTitle(course?.title || "");
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar atividade:", error);
        toast.error("Erro ao carregar atividade");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId]);

  // Helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sem prazo";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = assignment?.dueDate 
    ? new Date(assignment.dueDate) < new Date() 
    : false;

  const getStatusInfo = () => {
    if (submission?.gradedAt) {
      return { 
        label: "Avaliado", 
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <Award className="w-4 h-4" />
      };
    }
    if (submission?.submittedAt) {
      return { 
        label: "Entregue", 
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
    if (isOverdue) {
      return { 
        label: "Atrasado", 
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertCircle className="w-4 h-4" />
      };
    }
    return { 
      label: "Pendente", 
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock className="w-4 h-4" />
    };
  };

  // Handlers
  const handleSubmit = async () => {
    if (!assignmentId || !answerUrl.trim()) {
      toast.error("Por favor, insira um link para sua resposta");
      return;
    }

    setSubmitting(true);
    try {
      if (submission) {
        // Atualizar submissão existente
        const updated = await updateSubmission(submission.id, {
          answerUrl: answerUrl.trim(),
          contentUrl: answerUrl.trim(),
          comments: comments.trim() || undefined,
        });
        if (updated) {
          setSubmission(updated);
          toast.success("Resposta atualizada com sucesso!");
        }
      } else {
        // Nova submissão
        const newSubmission = await submitAssignment({
          assignmentId,
          answerUrl: answerUrl.trim(),
          contentUrl: answerUrl.trim(),
          comments: comments.trim() || undefined,
        });
        if (newSubmission) {
          setSubmission(newSubmission);
          toast.success("Atividade enviada com sucesso!");
        }
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao enviar atividade. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    
    if (!confirm("Tem certeza que deseja remover sua resposta?")) return;

    try {
      await deleteSubmission(submission.id);
      setSubmission(null);
      setAnswerUrl("");
      setComments("");
      toast.success("Resposta removida");
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover resposta");
    }
  };

  const status = getStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-600">Carregando atividade...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showTextLogo={true} />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <FileText className="w-16 h-16 text-gray-300" />
            <p className="text-gray-600">Atividade não encontrada.</p>
            <button
              onClick={() => router.back()}
              className="text-purple-600 hover:text-purple-800 transition"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showTextLogo={true} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => router.back()}
          className="mb-4 text-purple-600 hover:text-purple-800 transition"
        >
          ← Voltar
        </button>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          {/* Conteúdo Principal */}
          <div className="space-y-6">
            {/* Header da Atividade */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {assignment.title}
                      </h1>
                      {courseTitle && (
                        <p className="text-sm text-gray-500 mt-1">
                          {courseTitle} {lessonTitle && `• ${lessonTitle}`}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      Prof. {teacherName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Prazo: {formatDate(assignment.dueDate)}
                    </div>
                    {assignment.maxScore && (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        {assignment.maxScore} pontos
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {assignment.description && (
                <>
                  <div className="border-t border-gray-200 my-4" />
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {assignment.description}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Formulário de Resposta */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                {submission ? "Sua Resposta" : "Enviar Resposta"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Link da Resposta *
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={answerUrl}
                      onChange={(e) => setAnswerUrl(e.target.value)}
                      placeholder="https://drive.google.com/... ou link do arquivo"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cole o link do Google Drive, Dropbox, GitHub ou outro serviço
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Comentários (opcional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Adicione observações sobre sua entrega..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !answerUrl.trim()}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      submitting || !answerUrl.trim()
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : submission ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Atualizar Resposta
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Enviar Resposta
                      </>
                    )}
                  </button>

                  {submission && (
                    <button
                      onClick={handleDelete}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remover resposta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.zip,.rar"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Status da Entrega</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Situação</span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>

                {submission?.submittedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Enviado em</span>
                    <span className="text-gray-900">{formatDate(submission.submittedAt)}</span>
                  </div>
                )}

                {submission?.gradedAt && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Avaliado em</span>
                      <span className="text-gray-900">{formatDate(submission.gradedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Nota</span>
                      <span className="text-lg font-bold text-green-600">
                        {submission.score}/{assignment.maxScore || 10}
                      </span>
                    </div>
                  </>
                )}

                {isOverdue && !submission && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      O prazo de entrega já passou
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback do Professor */}
            {submission?.feedback && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  Feedback do Professor
                </h3>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              </div>
            )}

            {/* Pontuação */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Pontuação</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600">
                    {submission?.score ?? "-"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    de {assignment.maxScore || 10} pontos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Carregando...</div>
      </div>
    }>
      <ActivitiePageContent />
    </Suspense>
  );
}
