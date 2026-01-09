"use client";
import { LucideArchive, LucideEllipsisVertical, LucideUsers, Play } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import Teacher_Card from "../activitie_cards/teacher_card";
import YourProjects from "../cards/yourProjects";

interface ActivitiesProps{
    teacherLink: string;
    studentLink: string;
    title: string;
    description: string;
    date?: Date | string;             // data genérica (ex.: criação/publicação)
    score: number;
    studentScore: number;
    teacherName: string;
    userName?: string;  // Reservado para uso futuro
    deliveryDate?: Date | string;     // data de entrega (vencimento)
    teacherTitleLink: string;
    studentTitleLink: string;
}


export default function Activities({teacherLink, studentLink, title, description, date, score, teacherName, deliveryDate, userName: _userName, teacherTitleLink, studentTitleLink, studentScore}: ActivitiesProps) {
    
    const [showOptions, setShowOptions] = useState(false);
    const [showCopy, setShowCopy] = useState(false);
    const [copied, setCopied] = useState(false);
    React.useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 3000);
        return () => clearTimeout(timer);
    }, [copied]);
     
    React.useEffect(() => {
        if (!showCopy) return;
        const handleClick = (e: MouseEvent) => {
            const card = document.getElementById('copy-card');
            if (card && !card.contains(e.target as Node)) {
                setShowCopy(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showCopy]);
    const activityLink = typeof window !== 'undefined' ? window.location.href : '';
    
    const [showPrivateCommentBox, setShowPrivateCommentBox] = useState(false);
    const [_showProfCommentBox, _setShowProfCommentBox] = useState(false);
    const [privateComment, setPrivateComment] = useState("");
    
    type Comment = { user: string; photo: string; date: Date; text: string };
    const [privateComments, setPrivateComments] = useState<Comment[]>([]);
    const userPhoto = "https://randomuser.me/api/portraits/men/32.jpg";

    // Helper para formatar datas vindas como Date ou string
    const formatBRDate = (d?: Date | string) => {
        if (!d) return "";
        const dt = typeof d === 'string' ? new Date(d) : d;
        if (!(dt instanceof Date) || isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Prioriza deliveryDate (data de entrega). Se não vier, usa date.
    const dueLabel = formatBRDate(deliveryDate ?? date);

    return (
        <>
            {copied && (
                <div className="fixed bottom-6 left-6 z-50 px-4 py-2 pr-10 bg-gray-600 text-white rounded shadow-lg animate-fade-in">
                    Link copiado!
                </div>
            )}
            <section className="w-fit py-12 px-10">
             <div className="bg-white shadow-[15px_15px_4px_0_rgba(152,152,152,0.2)] p-8 rounded-xl px-20">
                <div className="flex flex-row items-start gap-5 justify-center ">
                    {/* ponta */}
                    <div className="">
                        <LucideArchive className="text-gray-500" size={30} />
                    </div>

                    {/* meio */}
                    <div className="w-1/2">
                        <div>
                            <div className="flex flex-row justify-between gap-5 mb-2 w-full">
                                <h2 className="text-2xl font-bold">{title}</h2>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                                        onMouseEnter={() => setShowOptions(true)}
                                        onMouseLeave={() => setShowOptions(false)}
                                        onClick={() => setShowCopy(true)}
                                    >
                                        <LucideEllipsisVertical />
                                        {showOptions && (
                                            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap z-10">Mais opções</span>
                                        )}
                                    </button>
                                    {showCopy && (
                                        <div id="copy-card" className="absolute left-1/2 -translate-x-1/2 top-full px-3 py-2 rounded bg-white border shadow z-20 flex flex-col items-center min-w-[120px]">
                                            <button
                                                type="button"
                                                className="text-gray-700 hover:bg-gray-100 px-1 py-1 rounded w-full text-left text-sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(activityLink);
                                                    setCopied(true);
                                                    setShowCopy(false);
                                                }}
                                            >
                                                Copiar link
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h5 className="text-gray-500">Prof. {teacherName}</h5>
                            <div className="w-full flex flex-row justify-between items-center mt-4">
                                <h5 className="text-gray-700">{studentScore}/{score}</h5>
                                <h5 className="text-gray-700">Data de Entrega: {dueLabel}</h5>
                            </div>

                            <div className="border-b border-gray-300 my-4"></div>
                            
                            <div className="mb-4">
                                <span>{description}</span>
                            </div>
                        </div>

                        {/* caixinha */}
                        <Teacher_Card link={teacherLink} titleLink={teacherTitleLink} />

                        <div className="border-b border-gray-300 my-4"></div>

                        <div className="w-full justify-start items-start">
                            <div className="w-full my-5 flex flex-row justify-start items-start gap-2">
                                <LucideUsers />
                                <h3>Comentários particulares</h3>
                            </div>
                            {!showPrivateCommentBox && (
                                <div>
                                    <button
                                        className="text-blue-500 hover:underline"
                                        onClick={() => setShowPrivateCommentBox(true)}
                                    >
                                        Adicionar um comentário particular
                                    </button>
                                </div>
                            )}
                            {showPrivateCommentBox && (
                                <div className="flex flex-col gap-2 mt-4">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={userPhoto}
                                            alt="Usuário"
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover border"
                                        />
                                        <input
                                            type="text"
                                            value={privateComment}
                                            onChange={e => setPrivateComment(e.target.value)}
                                            placeholder="Adicionar comentário particular..."
                                            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200 bg-white text-sm"
                                        />
                                        <button
                                            className="text-gray-600 relative group"
                                            type="button"
                                            onClick={() => {
                                                if (privateComment.trim()) {
                                                    setPrivateComments([
                                                        ...privateComments,
                                                        {
                                                            user: "Usuário", // Trocar pelo nome real se disponível
                                                            photo: userPhoto,
                                                            date: new Date(),
                                                            text: privateComment
                                                        }
                                                    ]);
                                                    setPrivateComment("");
                                                }
                                            }}
                                        >
                                            <Play size={20} />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Postar</span>
                                        </button>
                                    </div>
                                    {/* Comentários enviados */}
                                    {privateComments.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-2">
                                            {privateComments.map((comment, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-4 py-2">
                                                    <Image src={comment.photo} alt={comment.user} width={40} height={40} className="w-10 h-10 rounded-full object-cover border" />
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm">{comment.user}</span>
                                                            <span className="text-xs text-gray-500">{comment.date instanceof Date ? comment.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : String(comment.date)}</span>
                                                        </div>
                                                        <span className="text-sm text-gray-800">{comment.text}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* fim */}
                    <YourProjects studentLink={studentLink} studentTitleLink={studentTitleLink} />
                    
                
                </div>
             </div>
            </section>
            
        </>
    );
}
