"use client";
//fazer tipagem do q vem do sv 
export default function CoursesSection() {
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">Seus Cursos</h2>
                    <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mx-auto sm:mx-0">
                    Criar novo curso
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow border overflow-hidden w-full max-w-sm">
                        <div className="h-40 bg-yellow-400 flex items-center justify-center">
                            <span className="text-2xl font-bold text-black">SPIKE</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold mb-2">LEGO Education SPIKE</h3>
                            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                                Editar curso
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
