import { createClient } from "./client"; 

const supabase = createClient();

export async function uploadFile(file: File) {
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('submissions')
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage.from('submissions').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function addStudentProject({
  user_id,
  course_id,
  module_id,
  lesson_id,
  file_url
}: {
  user_id: string,
  course_id: number,
  module_id?: number,
  lesson_id?: number,
  file_url: string
}) {
  const { data, error } = await supabase
    .from('student_projects')
    .insert([{ user_id, course_id, module_id, lesson_id, file_url }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function sendStudentProject(submissionId: number) {
  const { data, error } = await supabase
    .from('student_projects')
    .update({ status: 'enviado', submitted_at: new Date() })
    .eq('id', submissionId)
    .select();

  if (error) throw error;
  return data[0];
}
