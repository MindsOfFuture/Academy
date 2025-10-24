import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type CourseProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

type OurCoursesProps = {
  cursos: CourseProps[];
};

export function OurCourses({ cursos }: OurCoursesProps) {
  // O hook useRouter deve ser chamado no topo do componente.
  const router = useRouter();

  // Função para lidar com a navegação para a página de um curso.
  const handleCourseClick = (id: string) => {
    router.push(`/course?id=${id}`);
  };

  // Função para navegar para a página de todos os cursos.
  const handleExploreAllClick = () => {
    router.push('/courses'); // Ou qualquer que seja a sua rota para todos os cursos.
  };

  return (
    <div className="flex flex-col items-center h-auto">
      <div className="container p-8 mx-auto">
        <h2 className="text-3xl font-bold">Nossos Cursos</h2>
        <p className="max-w-[480px]">
          Explore abaixo nossas opções de cursos e descubra o ideal para sua jornada!
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap items-start justify-center gap-20 p-6">
          {cursos.map((curso, index) => (
            <motion.div
              key={curso.id}
              // O onClick deve receber uma função que será executada no clique.
              onClick={() => handleCourseClick(curso.id)}
              className="flex flex-col items-start justify-start w-[300px] h-[500px] p-3 text-black bg-white rounded-lg shadow-lg cursor-pointer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3 }
              }}
            >
              <Image
                src={curso.imageUrl}
                alt={curso.title}
                width={300}  // Proporções que correspondem melhor ao layout do card
                height={180}
                className="w-full h-[180px] bg-gray-200 object-cover"
              />
              <div className="flex flex-col flex-1 w-full mt-4">
                {/* Usando classes de texto padrão do Tailwind para consistência */}
                <h3 className="flex items-center justify-center w-full text-xl font-bold">
                  {curso.title}
                </h3>
                <p className="flex-1 w-full mt-4 text-base">{curso.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <motion.button
            onClick={handleExploreAllClick} // Adicionando a função de clique ao botão
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 font-semibold text-white transition bg-purple-600 rounded-xl shadow-md hover:bg-purple-700"
          >
            Explorar todos os cursos
          </motion.button>
        </div>
      </div>
    </div>
  );
}