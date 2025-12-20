export type CourseProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export type ModuleProps = {
  id: string;
  course_id: string;
  title: string;
};

export type LessonProps = {
  id: string;
  module_id: string;
  title: string;
  duration: number;
  link: string;
};

export type ProgressoProps = {
  id: string;
  created_at: string;
  id_item_concluido: number;
  id_modulo: number;
  id_curso: string;
};
