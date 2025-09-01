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
      <div className="container mx-auto p-8">
        <h2 className="text-3xl font-bold">Nossos Cursos</h2>
        <p className="max-w-[480px]">
          Explore abaixo nossas opções de cursos e descubra o ideal para sua jornada!
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-center items-start gap-20 flex-wrap p-6">
          {
          cursos.map((curso, index) => (
          
            <div  className="flex flex-col justify-center"key={index}
            >
              <Image
                src={curso.imageUrl}
                alt={curso.title}
                width={430}
                height={72}
                className="w-full h-[180px] bg-gray-200 p-4"
              />
                <div className="relative size-40">
                <svg className="size-full rotate-180" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-100 dark:text-neutral-700" stroke-width="3" stroke-dasharray="50 100" stroke-linecap="round"></circle>

                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-orange-600 dark:text-orange-500" stroke-width="1" stroke-dasharray="25 100" stroke-linecap="round"></circle>
                </svg>

                <div className="absolute top-9 start-1/2 transform -translate-x-1/2 text-center">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">50</span>
                    <span className="text-xs text-orange-600 dark:text-orange-500 block">Average</span>
                </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
