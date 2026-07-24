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
import CourseDetail from "@/components/dashboard/CourseManagement/courseDetail";
import LearningPathManager from "@/components/dashboard/LearningPathManagement/LearningPathManager";
import ChatsPanel from "@/components/dashboard/ChatsPanel";
import PendingCorrections from "@/components/dashboard/PendingCorrections";
import AnalyticsTab from "@/components/dashboard/Analytics/AnalyticsTab";
import { listUsersClient } from "@/lib/api/profiles";

type TabType = "courses" | "paths" | "chats" | "corrections" | "analytics";
const validTabs: TabType[] = ["courses", "paths", "chats", "corrections", "analytics"];

export default function CoursesSection({ isAdmin = false }: { isAdmin?: boolean }) {
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
    if (!title || !description) {
      alert("Preencha título e descrição!");
      return;
    }

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
        else alert("Erro ao atualizar curso.");
      } else {
        const newCourse = await createCourse({
          title,
          description,
          imageUrl,
          status: isPublished ? "active" : "draft",
          audience: isTeacherOnly ? "teacher" : "student",
        });
        if (newCourse) setCourses((prev) => [...prev, newCourse]);
        else alert("Erro ao criar curso.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar curso.";
      alert(message);
      return;
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
      <div className="flex gap-2 border-b mb-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex-shrink-0 px-4 py-2 font-medium transition-colors ${activeTab === "courses"
            ? "text-purple-600 border-b-2 border-purple-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Cursos
        </button>
        <button
          onClick={() => setActiveTab("paths")}
          className={`flex-shrink-0 px-4 py-2 font-medium transition-colors ${activeTab === "paths"
            ? "text-purple-600 border-b-2 border-purple-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Trilhas de Aprendizagem
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-shrink-0 px-4 py-2 font-medium transition-colors ${activeTab === "chats"
            ? "text-purple-600 border-b-2 border-purple-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("corrections")}
          className={`flex-shrink-0 px-4 py-2 font-medium transition-colors ${activeTab === "corrections"
            ? "text-purple-600 border-b-2 border-purple-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Correções Pendentes
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-shrink-0 px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === "analytics"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Analytics
          </button>
        )}
      </div>

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

      {/* Conteúdo da Tab de Cursos */}
      {activeTab === "courses" && (
        <>
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold">Seus Cursos</h2>
              <p className="text-gray-600 text-sm">
                Gerencie seus cursos e módulos abaixo.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsOpen(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mx-auto sm:mx-0"
            >
              Criar novo curso
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
                      className="flex-auto bg-gray-100 rounded hover:bg-gray-200 py-2"
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTeacherOnly ? "bg-purple-500" : "bg-gray-300"
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
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
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
                  className="mb-4 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
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
