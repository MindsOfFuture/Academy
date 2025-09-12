"use client";

import { useEffect, useState } from "react";
import {
    getCursoCompleto,
    insertModule,
    insertLesson,
    updateCurso,
    deleteModule,
    deleteLesson,
    ModuleProps,
    LessonProps,
} from "@/components/api/courseApi";

type Props = {
    courseId: string;
    onBack: () => void;
};

export default function CourseDetail({ courseId, onBack }: Props) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // States do curso para edição
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    // States para novo módulo
    const [moduleTitle, setModuleTitle] = useState("");

    // States para nova lição
    const [lessonTitle, setLessonTitle] = useState("");
    const [lessonDuration, setLessonDuration] = useState("");
    const [lessonLink, setLessonLink] = useState("");
    const [selectedModule, setSelectedModule] = useState<string>("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getCursoCompleto(courseId);
            setCourse(data);
            if (data) {
                setTitle(data.title);
                setDescription(data.description);
                setImageUrl(data.imageUrl);
            }
            setLoading(false);
        };
        fetchData();
    }, [courseId]);

    const refreshCourse = async () => {
        const data = await getCursoCompleto(courseId);
        setCourse(data);
    };

    const handleUpdateCourse = async () => {
        if (!title.trim() || !description.trim()) {
            alert("Preencha título e descrição!");
            return;
        }

        const updated = await updateCurso(courseId, {
            title,
            description,
            imageUrl,
        });

        if (updated) {
            await refreshCourse(); // 🔥 força atualizar da API
            alert("Curso atualizado!");
        } else {
            alert("Erro ao atualizar curso.");
        }
    };

    const handleAddModule = async () => {
        if (!moduleTitle.trim()) return alert("Digite um título para o módulo!");

        const newModule = await insertModule({ Curso: courseId, title: moduleTitle });
        if (newModule) {
            await refreshCourse(); // 🔥 recarrega curso inteiro
            setModuleTitle("");
        }
    };

    const handleAddLesson = async () => {
        if (!selectedModule) return alert("Selecione um módulo!");
        if (!lessonTitle.trim()) return alert("Digite um título para a lição!");

        const newLesson = await insertLesson({
            modulo: selectedModule,
            title: lessonTitle,
            duration: lessonDuration,
            link: lessonLink,
        });

        if (newLesson) {
            await refreshCourse(); // 🔥 recarrega curso inteiro
            setLessonTitle("");
            setLessonDuration("");
            setLessonLink("");
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm("Deseja realmente deletar este módulo e todas as lições?")) return;
        const success = await deleteModule(id);
        if (success) {
            await refreshCourse(); // 🔥 recarrega curso inteiro
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm("Deseja realmente deletar esta lição?")) return;
        const success = await deleteLesson(id);
        if (success) {
            await refreshCourse(); // 🔥 recarrega curso inteiro
        }
    };


    if (loading) return <p>Carregando curso...</p>;
    if (!course) return <p>Curso não encontrado.</p>;

    return (
        <div>


            {/* Edição do curso */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-2xl font-bold mb-3">Editar Curso</h2>
                <input
                    type="text"
                    placeholder="Título do curso"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border rounded px-2 py-1 w-full mb-2"
                />
                <textarea
                    placeholder="Descrição do curso"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border rounded px-2 py-1 w-full mb-2"
                />
                <input
                    type="text"
                    placeholder="URL da imagem"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="border rounded px-2 py-1 w-full mb-2"
                />
                <button
                    onClick={handleUpdateCourse}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                    Salvar alterações
                </button>
            </div>

            {/* Módulos */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h3 className="text-xl font-semibold mb-2">Módulos</h3>
                <div className="space-y-4">
                    {course.modules?.map((mod: ModuleProps) => (
                        <div key={mod.id} className="border rounded p-4 bg-white shadow">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{mod.title}</h4>
                                <button
                                    onClick={() => handleDeleteModule(mod.id)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                    Deletar módulo
                                </button>
                            </div>
                            <ul className="list-disc pl-6 text-sm text-gray-600 mt-2">
                                {mod.lessons?.map((lesson: LessonProps) => (
                                    <li key={lesson.id} className="flex justify-between items-center mt-1">
                                        <span>
                                            {lesson.title} – {lesson.duration} min
                                        </span>
                                        <button
                                            onClick={() => handleDeleteLesson(lesson.id, mod.id)}
                                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                                        >
                                            X
                                        </button>
                                    </li>
                                ))}
                                {(!mod.lessons || mod.lessons.length === 0) && (
                                    <li className="text-gray-400">Nenhuma lição ainda</li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Adicionar módulo */}
                <div className="mt-6 flex gap-2">
                    <input
                        type="text"
                        placeholder="Novo módulo"
                        value={moduleTitle}
                        onChange={(e) => setModuleTitle(e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                    />
                    <button
                        onClick={handleAddModule}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-6">
                {/* Adicionar lição */}
                <div className="">
                    <h3 className="text-lg font-semibold mb-2">Adicionar Lição</h3>
                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2"
                    >
                        <option value="">Selecione um módulo</option>
                        {course.modules?.map((m: ModuleProps) => (
                            <option key={m.id} value={m.id}>
                                {m.title}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Título da lição"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2"
                    />
                    <input
                        type="text"
                        placeholder="Duração (ex: 10 min)"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2"
                    />
                    <input
                        type="text"
                        placeholder="Link da lição (YouTube, etc.)"
                        value={lessonLink}
                        onChange={(e) => setLessonLink(e.target.value)}
                        className="border rounded px-2 py-1 w-full mb-2"
                    />
                    <button
                        onClick={handleAddLesson}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                        Adicionar Lição
                    </button>
                </div>
            </div>



        </div>
    );
}
