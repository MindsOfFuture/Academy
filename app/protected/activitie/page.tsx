import Activities from "@/components/activities/activities";
import { Dot } from "lucide-react";

export default async function Activitie() {

  const activity = {
    teacherLink: "https://drive.google.com/drive/folders/1234",
    studentLink: "https://github.com/giovana123/projeto-final",
    title: "Projeto Final - Desenvolvimento Web",
    description:
      "Criação de um site completo utilizando React, Next.js e Tailwind, com integração a uma API externa.",
    date: new Date(2025, 9, 10),
    score: 10,
    teacherName: "Igor Knop",
    userName: "Giovana Maieli",
    deliveryDate: new Date(2025, 9, 20),
    teacherTitleLink: "Google Drive - Projeto Final",
    studentTitleLink: "GitHub - Projeto Final",
    studentScore: 8
  };
  return (
    <div className="flex justify-center items-center w-full">
      <div className="bg-white shadow-md rounded-lg p-4">
        <Dot />
      </div>
      <Activities 
        teacherLink={activity.teacherLink}
        studentLink={activity.studentLink}
        title={activity.title}
        description={activity.description}
        date={activity.date}
        score={activity.score}
        studentScore={activity.studentScore}
        teacherName={activity.teacherName}
        userName={activity.userName}
        deliveryDate={activity.deliveryDate}
        teacherTitleLink={activity.teacherTitleLink}
        studentTitleLink={activity.studentTitleLink}
      />

    </div>
  );
}
