import Image from 'next/image';
import { motion } from 'framer-motion';

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

export function OurCourses({ title, description, cursos }: OurCoursesProps) {
  return (
    <div className="flex flex-col h-auto items-center">
      <div className="container mx-auto p-8">
        <h2 className="text-3xl font-bold">Nossos Cursos</h2>
        <p className="w-[480px]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi hendrerit vulputate risus. Nulla a eros nisi. Donec condimentum.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex h-screen justify-center items-start gap-20 flex-wrap p-6">
          {cursos.map((curso, index) => (
            <motion.div
              key={index}
              className="p-3 rounded-[5] bg-white shadow-lg text-black flex flex-col items-start justify-start w-[300px] h-[500px] "
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src={curso.imageUrl}
                alt={curso.title}
                width={430}
                height={72}
                className="w-full h-[180px] bg-gray-200 p-4"
              />
              <div className="mt-4 flex flex-col flex-1 w-full">
                <h3 className="text-[18pt] font-bold w-full flex items-center justify-center">
                  {curso.title}
                </h3>
                <p className="text-[11pt] w-full mt-4 flex-1">{curso.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
