import Image from 'next/image';
import { motion } from 'framer-motion';

type CourseProps = {
  id: string;
  title: string;
  percentCourse: number;
  imageUrl: string;
};

type YourCoursesProps = {
  cursos: CourseProps[];
};

export function YourCourses({ cursos }: YourCoursesProps) {
  return (
    <div className="flex flex-col h-auto items-center">
      

      <div className="flex flex-col">
        <div className="flex justify-center items-start gap-20 flex-wrap p-6">
          {
          cursos.map((curso, index) => (
          
            <div 
                          className="flex flex-col gap-4 h-auto items-center p-3 rounded-[5] bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] text-black flex flex-col items-start justify-start w-[300px] h-[500px]"

            >
              <Image
                src={curso.imageUrl}
                alt={curso.title}
                width={430}
                height={72}
                className="w-full h-[180px] bg-gray-200 p-4"
              />
             <h3 className="text-[18pt] font-bold w-full flex items-center justify-center">
                  {curso.title}
                </h3>
            <div className="relative size-40">
                <svg className="size-full rotate-180" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-100 dark:text-neutral-700" strokeWidth="3" stroke-dasharray="50 100" stroke-linecap="round"></circle>

                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-600 dark:text-orange-500" strokeWidth="1" stroke-dasharray="25 100" stroke-linecap="round"></circle>
                </svg>

                <div className="absolute top-9 start-1/2 transform -translate-x-1/2 text-center">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">{curso.percentCourse}%</span>
                    <span className="text-xs text-orange-600 dark:text-orange-500 block">Concluido</span>
                </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
