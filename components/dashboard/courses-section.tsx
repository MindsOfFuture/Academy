"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  createCourse,
  listCourses,
  updateCourse,
} from "@/lib/api/courses";
import { type CourseSummary, type LearningPathSummary } from "@/lib/api/types";
import dynamic from "next/dynamic";
import LearningPathManager from "@/components/dashboard/LearningPathManagement/LearningPathManager";
import ChatsPanel from "@/components/dashboard/ChatsPanel";
import PendingCorrections from "@/components/dashboard/PendingCorrections";
import GameResearchPanel from "@/components/dashboard/GameResearch/GameResearchPanel";
import { listUsersClient } from "@/lib/api/profiles";
import toast from "react-hot-toast";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "@/components/ui/botoes";
import { cn } from "@/lib/utils";

const loadingPanel = () => <p role="status">Carregando painel...</p>;
const CourseDetail = dynamic(() => import("@/components/dashboard/CourseManagement/courseDetail"), { loading: loadingPanel });
const AnalyticsTab = dynamic(() => import("@/components/dashboard/Analytics/AnalyticsTab"), { loading: loadingPanel });

type TabType = "courses" | "paths" | "users" | "chats" | "corrections" | "analytics" | "jogos";
const validTabs: TabType[] = ["courses", "paths", "users", "chats", "corrections", "analytics", "jogos"];

/** Abas na ordem do uso: conteúdo, pessoas, o que os alunos mandaram, números. */
const ABAS: { id: TabType; rotulo: string; soAdmin?: boolean }[] = [
  { id: "courses", rotulo: "Cursos" },
  { id: "paths", rotulo: "Trilhas" },
  { id: "users", rotulo: "Usuários", soAdmin: true },
  { id: "corrections", rotulo: "Correções pendentes" },
  { id: "chats", rotulo: "Chats" },
  { id: "analytics", rotulo: "Analytics", soAdmin: true },
  { id: "jogos", rotulo: "Respostas dos jogos", soAdmin: true },
];

export default function CoursesSection({
  isAdmin = false,
  usuarios = null,
}: {
  isAdmin?: boolean;
  /** Lista de usuários (vem do servidor, só para admin): vira a aba "Usuários". */
  usuarios?: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("courses");
  const [isOpen, setIsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isTeacherOnly, setIsTeacherOnly] = useState(false);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Trava síncrona: dois cliques no mesmo render veem o mesmo `saving` antigo.
  const savingRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Lê o parâmetro ?tab= da URL para permitir deep-linking via notificações
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
      // Aguarda o render e scrolla até a seção
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [searchParams]);

  // 🔄 Atualiza lista de cursos
  const refreshCourses = async () => {
    const data = await listCourses();
    setCourses(data);
  };

  // 🔄 Atualiza lista de trilhas
  const refreshPaths = async () => {
    try {
      const res = await fetch("/api/learning-paths");
      if (res.ok) {
        const data = await res.json();
        setPaths(data);
      }
    } catch (error) {
      console.error("Erro ao carregar trilhas:", error);
    }
  };

  // 🔄 Efeito inicial para carregar dados
  useEffect(() => {
    refreshCourses();
    refreshPaths();
    
    // Fetch users for Analytics
    async function fetchAdminData() {
      if (isAdmin) {
        const usersList = await listUsersClient();
        setUsers(usersList.map(u => ({ id: u.id, name: u.full_name || "Desconhecido", email: "" })));
      }
    }
    fetchAdminData();
  }, [isAdmin]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setIsPublished(false);
    setIsTeacherOnly(false);
    setEditingCourse(null);
  };

  const handleCourseUpdated = (updatedCourse: CourseSummary) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  // Criar ou atualizar curso
  const handleSaveCourse = async () => {
    if (savingRef.current) return;
    if (!title || !description) {
      toast.error("Preencha título e descrição!");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      if (editingCourse) {
        const updated = await updateCourse(editingCourse.id, {
          title,
          description,
          imageUrl,
          status: isPublished ? "active" : "draft",
          audience: isTeacherOnly ? "teacher" : "student",
        });
        if (updated) handleCourseUpdated(updated);
        else {
          toast.error("Erro ao atualizar curso.");
          return;
        }
      } else {
        const newCourse = await createCourse({
          title,
          description,
          imageUrl,
          status: isPublished ? "active" : "draft",
          audience: isTeacherOnly ? "teacher" : "student",
        });
        if (newCourse) setCourses((prev) => [...prev, newCourse]);
        else {
          toast.error("Erro ao criar curso.");
          return;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar curso.";
      toast.error(message);
      return;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }

    resetForm();
    setIsOpen(false);
  };

  // Função disponível para uso futuro (edição inline de cursos)
  const _handleEditCourse = (course: CourseSummary) => {
    setEditingCourse(course);
    setTitle(course.title);
    setDescription(course.description ?? "");
    setImageUrl(course.thumbUrl ?? "");
    setIsPublished(course.status === "active");
    setIsTeacherOnly(course.audience === "teacher");
    setIsOpen(true);
  };

  return (
    <div ref={sectionRef}>
      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto whitespace-nowrap">
        {ABAS.filter((aba) => !aba.soAdmin || isAdmin).map((aba) => (
          <button
            key={aba.id}
            type="button"
            aria-pressed={activeTab === aba.id}
            onClick={() => setActiveTab(aba.id)}
            className={cn(
              "flex-shrink-0 min-h-11 px-4 py-2 font-medium transition-colors border-b-2",
              activeTab === aba.id
                ? "text-[#684A97] border-[#684A97]"
                : "text-gray-500 border-transparent hover:text-gray-700",
            )}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {/* Conteúdo da Tab de Usuários */}
      {activeTab === "users" && isAdmin && usuarios}

      {/* Conteúdo da Tab de Trilhas */}
      {activeTab === "paths" && (
        <LearningPathManager
          initialPaths={paths}
          availableCourses={courses}
        />
      )}

      {/* Conteúdo da Tab de Chats */}
      {activeTab === "chats" && <ChatsPanel />}

      {/* Conteúdo da Tab de Correções Pendentes */}
      {activeTab === "corrections" && (
        <PendingCorrections />
      )}

      {/* Conteúdo da Tab de Analytics */}
      {activeTab === "analytics" && isAdmin && (
        <AnalyticsTab isAdmin={isAdmin} courses={courses} paths={paths} users={users} />
      )}

      {/* Conteúdo da Tab de Respostas dos jogos */}
      {activeTab === "jogos" && isAdmin && <GameResearchPanel />}

      {/* Conteúdo da Tab de Cursos */}
      {activeTab === "courses" && (
        <>
          {/* Cabeçalho */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-semibold">Cursos da plataforma</h3>
              <p className="text-gray-600 text-sm">
                Gerencie seus cursos e módulos abaixo.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsOpen(true);
              }}
              className={BOTAO_PRIMARIO}
            >
              <span aria-hidden="true">+</span> Criar novo curso
            </button>
          </div>

          {/* LISTAGEM DE CURSOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow border overflow-hidden w-full max-w-sm"
              >
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {course.thumbUrl ? (
                    <Image
                      src={course.thumbUrl}
                      alt={course.title}
                      width={400}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">
                      {course.title[0]}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCourseId(course.id)}
                      className={cn(BOTAO_SECUNDARIO, "flex-auto")}
                    >
                      Gerenciar
                    </button>


                  </div>
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="text-gray-500">Nenhum curso encontrado.</p>
            )}
          </div>

          {/* MODAL DE CRIAR / EDITAR CURSO */}
          {isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingCourse ? "Editar Curso" : "Novo Curso"}
                </h2>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Título do curso"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                  <textarea
                    placeholder="Descrição do curso"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="text"
                    placeholder="URL da imagem (opcional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="border p-2 rounded w-full"
                  />

                  {/* Switch de Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-medium text-gray-700">Publicar curso</label>
                      <p className="text-sm text-gray-500">
                        {isPublished
                          ? "O curso está visível para todos os usuários"
                          : "O curso está em rascunho (visível apenas para você)"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublished(!isPublished)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? "bg-green-500" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  {/* Switch de Público-alvo */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="font-medium text-gray-700">Apenas para professores</label>
                      <p className="text-sm text-gray-500">
                        {isTeacherOnly
                          ? "Este curso é visível apenas para professores e administradores"
                          : "Este curso é visível para todos os usuários"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTeacherOnly(!isTeacherOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTeacherOnly ? "bg-[#684A97]" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTeacherOnly ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      resetForm();
                      setIsOpen(false);
                    }}
                    className={BOTAO_SECUNDARIO}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    disabled={saving}
                    className={BOTAO_PRIMARIO}
                  >
                    {editingCourse ? "Salvar alterações" : "Criar Curso"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE DETALHE DO CURSO */}
          {selectedCourseId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
              <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl p-6 overflow-auto max-h-[90vh]">
                <button
                  onClick={async () => {
                    await refreshCourses();
                    setSelectedCourseId(null);
                  }}
                  className={cn(BOTAO_SECUNDARIO, "mb-4")}
                >
                  Fechar
                </button>

                <CourseDetail
                  courseId={selectedCourseId}
                  onBack={async () => {
                    await refreshCourses();
                    setSelectedCourseId(null);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
