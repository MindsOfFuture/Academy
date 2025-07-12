import Image from 'next/image';
import Button from '../button/button';
import CountUp from '../counting/couting';
import { RefObject } from 'react';

type CourseProps = {
  title: string;
  description: string;
  imageUrl: string;
};

type OurCoursesProps = {
  title: string;
  description: string;
  cursos: CourseProps[];
};

export function OurCourses({ title,description,cursos }: OurCoursesProps) {
  // cursos = []
  return (
    <div className="flex flex-col  h-[auto] items-center ">
      <div className="container mx-auto p-8">

        <h2 className="text-3xl text-white font-bold mb-6">Nossos Cursos</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi hendrerit vulputate risus. Nulla a eros nisi. Donec condimentum.</p>
        </div>

        <div className="flex flex-col ">
        <div className="flex h-screen justify-center items-start gap-20 flex-wrap p-6 " >
          {
            cursos.map((curso, index) => (
              <div key={index} className="p-3 rounded-[5] shadow-lg text-black flex flex-col items-start justify-start w-[300px] h-[500px]">
                <Image src={curso.imageUrl} alt={curso.title} width={430} height={72} className="w-[100%] bg-gray-200 p-4" />
                <div className="mt-4 flex flex-col flex-1 ">
                  <h3 className="text-[18pt] font-bold w-full flex items-center justify-center">{curso.title}</h3>
                  <p className="text-[11pt] w-full mt-4 flex-1">{curso.description}</p>
                </div>
              </div>
            ))
          }

        </div>
      </div>
    </div>
  );
}
