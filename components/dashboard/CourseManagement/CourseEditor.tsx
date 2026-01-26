"use client";

type CourseEditorProps = {
  title: string;
  description: string | null;
  imageUrl: string;
  status: string | null;
  audience: string | null;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

export default function CourseEditor({
  title,
  description,
  imageUrl,
  status,
  audience,
  onChange,
  onSave,
  onDelete,
}: CourseEditorProps) {
  const isPublished = status === "active";
  const isTeacherOnly = audience === "teacher";

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-2xl font-bold mb-3">Editar Curso</h2>

      <input
        type="text"
        placeholder="Título do curso"
        value={title}
        onChange={(e) => onChange("title", e.target.value)}
        className="border rounded px-2 py-1 w-full mb-2"
      />

      <textarea
        placeholder="Descrição do curso"
        value={description ?? ""}
        onChange={(e) => onChange("description", e.target.value)}
        className="border rounded px-2 py-1 w-full mb-2 resize-y min-h-[100px]"
        rows={4}
      />

      <input
        type="text"
        placeholder="URL da imagem"
        value={imageUrl}
        onChange={(e) => onChange("imageUrl", e.target.value)}
        className="border rounded px-2 py-1 w-full mb-2"
      />

      {/* Switch de Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
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
          onClick={() => onChange("status", isPublished ? "draft" : "active")}
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
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
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
          onClick={() => onChange("audience", isTeacherOnly ? "student" : "teacher")}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTeacherOnly ? "bg-purple-500" : "bg-gray-300"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTeacherOnly ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
        >
          Salvar
        </button>

        <button
          onClick={onDelete}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Deletar curso
        </button>
      </div>
    </div>
  );
}
