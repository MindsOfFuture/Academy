import Image from 'next/image';
import Link from 'next/link';
import { YCourseProps } from '../api/indexApi';


type YourCoursesProps = {
  cursos: YCourseProps[];
};

export function YourCourses({ cursos }: YourCoursesProps) {
  return (
    <div className="flex flex-col h-auto items-center">
      <div className="flex flex-col">
        <div className="flex justify-center items-start gap-20 flex-wrap p-6">
          {cursos.map((curso) => (
            <Link 
              key={curso.Curso.id} 
              href={`/course?id=${curso.Curso.id}`}
              className="flex flex-col gap-4 h-auto items-center p-3 rounded-[5] bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] text-black w-[300px] h-[500px] cursor-pointer hover:shadow-lg transition"
            >
              <Image
                src={curso.Curso.imageUrl}
                alt={curso.Curso.title}
                width={430}
                height={72}
                className="w-full h-[180px] bg-gray-200 p-4"
              />
              <h3 className="text-[18pt] font-bold w-full flex items-center justify-center">
                {curso.Curso.title}
              </h3>

              <div className="relative size-40">
                <svg className="size-full rotate-180" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-100" strokeWidth="3" strokeDasharray="50 100" strokeLinecap="round"></circle>
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-600" strokeWidth="1" strokeDasharray="25 100" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute top-9 start-1/2 transform -translate-x-1/2 text-center">
                  <span className="text-2xl font-bold text-orange-600">{curso.progresso}%</span>
                  <span className="text-xs text-orange-600 block">Concluído</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
