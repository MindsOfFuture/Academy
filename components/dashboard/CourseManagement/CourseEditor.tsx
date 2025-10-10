"use client";

type CourseEditorProps = {
  title: string;
  description: string;
  imageUrl: string;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

export default function CourseEditor({
  title,
  description,
  imageUrl,
  onChange,
  onSave,
  onDelete,
}: CourseEditorProps) {
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
        value={description}
        onChange={(e) => onChange("description", e.target.value)}
        className="border rounded px-2 py-1 w-full mb-2"
      />

      <input
        type="text"
        placeholder="URL da imagem"
        value={imageUrl}
        onChange={(e) => onChange("imageUrl", e.target.value)}
        className="border rounded px-2 py-1 w-full mb-2"
      />

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
