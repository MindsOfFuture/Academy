import { useEffect, useRef, useState } from "react";
import Student_Card from "../activitie_cards/student_card";
import { Link2, Paperclip, Plus } from "lucide-react";
import ReactDOM from "react-dom";
import { toast } from "react-hot-toast";

function isValidUrl(url: string) {
    return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/\S*)?$/.test(url);
}

interface YourProjectsProps {
    studentLink: string;
    studentTitleLink: string;
    activityId?: string;
    dueDate?: Date | string;
    requiresSubmission?: boolean;
    allowLateSubmission?: boolean;
    allowResubmission?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    isSubmitted?: boolean;
    onSubmit?: (files: File[]) => Promise<void>;
    onUpdate?: (files: File[]) => Promise<void>;
    onDelete?: () => void;
}

export default function YourProjects({
    studentLink,
    studentTitleLink,
    activityId,
    dueDate,
    requiresSubmission = true,
    allowLateSubmission = false,
    allowResubmission = true,
    maxFileSize = 10 * 1024 * 1024,
    allowedFileTypes = [".pdf", ".doc", ".docx", ".zip"],
    isSubmitted = false,
    onSubmit,
    onUpdate,
    onDelete,
}: YourProjectsProps) {
    const [showAddCard, setShowAddCard] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkError, setLinkError] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    type Preview = { type: "file"; file: File; url: string } | { type: "link"; url: string; title: string };
    const [filePreviews, setFilePreviews] = useState<Preview[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentSubmitted, setCurrentSubmitted] = useState<boolean>(!!isSubmitted);
    const [isCardVisible, setIsCardVisible] = useState<boolean>(true);
    const addButtonRef = useRef<HTMLButtonElement | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const storageKey = `submission_${activityId ?? "default"}`;
    const due: Date | undefined = dueDate ? (dueDate instanceof Date ? dueDate : new Date(dueDate)) : undefined;
    const hasDeadline = !!due;
    const isDeadlinePassed = hasDeadline && due ? due < new Date() : false;
    const canSubmit = !isDeadlinePassed || allowLateSubmission;
    const canResubmit = currentSubmitted && allowResubmission;

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw && JSON.parse(raw).submitted) setCurrentSubmitted(true);
        } catch {}
    }, [storageKey]);

    // Keep dropdown anchored when viewport changes
    useEffect(() => {
        if (!showAddCard) return;
        const update = () => {
            const el = addButtonRef.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
            }
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [showAddCard]);

    const previewsRef = useRef<Preview[]>([]);
    useEffect(() => { previewsRef.current = filePreviews; }, [filePreviews]);
    useEffect(() => () => { previewsRef.current.forEach(p => { if (p.type === "file") URL.revokeObjectURL(p.url); }); }, []);

    const validateFile = (file: File): string | null => {
        if (!allowedFileTypes.some(type => file.name.toLowerCase().endsWith(type))) return "Arquivo não permitido";
        if (file.size > maxFileSize) return "Tamanho máximo excedido";
        return null;
    };

    const handleFileSelect = (filesList: FileList | null) => {
        if (!filesList) return;
        const files = Array.from(filesList);
        for (const f of files) {
            const err = validateFile(f);
            if (err) { toast.error(err); return; }
        }
        setSelectedFiles(prev => [...prev, ...files]);
        const newPreviews: Preview[] = files.map(f => ({ type: "file", file: f, url: URL.createObjectURL(f) }));
        setFilePreviews(prev => [...prev, ...newPreviews]);
        setShowAddCard(false);
    };

    const handleSubmit = async () => {
        if (!requiresSubmission) return;
        if (!canSubmit && !canResubmit) { toast.error("O prazo de entrega já passou. Não é possível enviar esta atividade."); return; }
        const hasFiles = filePreviews.some(p => p.type === "file") || selectedFiles.length > 0;
        if (!hasFiles) { toast.error("Selecione pelo menos um arquivo para enviar."); return; }
        try {
            setIsSubmitting(true);
            const filesToSend = filePreviews.filter((p): p is { type: "file"; file: File; url: string } => p.type === "file").map(p => p.file);
            if (currentSubmitted && canResubmit && onUpdate) {
                await onUpdate(filesToSend);
                toast.success("Atividade atualizada com sucesso.");
            } else if (!currentSubmitted && onSubmit) {
                await onSubmit(filesToSend);
                toast.success("Atividade enviada com sucesso.");
            } else {
                setCurrentSubmitted(true);
                toast.success("Atividade enviada com sucesso.");
            }
            setCurrentSubmitted(true);
            setSelectedFiles([]);
            filePreviews.forEach(p => { if (p.type === "file") URL.revokeObjectURL(p.url); });
            setFilePreviews([]);
            localStorage.setItem(storageKey, JSON.stringify({ submitted: true, submittedAt: new Date().toISOString() }));
        } catch (err) {
            console.error(err);
            toast.error("Erro ao enviar atividade. Tente novamente.");
        } finally { setIsSubmitting(false); }
    };

    if (!requiresSubmission) return null;
    return (
        <>
            <div className="w-fit flex flex-col justify-center items-center gap-4 ml-8">
                <div className="w-full p-5 border border-gray-300 rounded-lg mb-4 h-fit shadow-lg">
                    <div className="w-full mb-5 flex flex-row justify-between items-center">
                        <span>Seus Trabalhos</span>
                        <span>Com nota</span>
                    </div>

                    {isCardVisible && (
                        <div className="mb-5">
                            <Student_Card 
                                link={studentLink} 
                                StudentTitleLink={studentTitleLink}
                                onDelete={() => {
                                    setIsCardVisible(false);
                                    localStorage.removeItem(storageKey);
                                    setSelectedFiles([]);
                                    setCurrentSubmitted(false);
                                    onDelete?.();
                                    toast.success("Atividade removida com sucesso");
                                }}
                            />
                        </div>
                    )}

                    <div className="w-full flex flex-col justify-center items-center gap-4">
                        {filePreviews.length > 0 && (
                            <div className="w-full">
                                <ul className="space-y-2">
                                    {filePreviews.map((p, index) => (
                                        <li key={index} className="text-sm">
                                            <Student_Card
                                                link={p.url}
                                                StudentTitleLink={p.type === "file" ? p.file.name : p.title}
                                                onDelete={() => {
                                                    if (p.type === "file") URL.revokeObjectURL(p.url);
                                                    setFilePreviews(prev => prev.filter((_, i) => i !== index));
                                                    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                                    toast.success('Entrada removida');
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button
                            ref={addButtonRef}
                            className="w-full text-blue-700 py-2 px-4 border-2 border-gray-400 rounded-full hover:bg-blue-100 transition-colors justify-center items-center flex mb-2"
                            onClick={() => {
                                setShowAddCard(true);
                                const el = addButtonRef.current;
                                if (el) {
                                    const rect = el.getBoundingClientRect();
                                    setMenuPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
                                }
                            }}
                        > 
                            <div className="flex flex-row gap-2">
                                <Plus/>
                                Adicionar ou criar
                            </div>
                        </button>

                        {showAddCard && menuPos && ReactDOM.createPortal(
                            <>
                                {/* Backdrop to capture outside clicks */}
                                <div
                                    className="fixed inset-0 z-[9998]"
                                    onClick={() => { setShowAddCard(false); setShowLinkInput(false); }}
                                />
                                {/* Anchored dropdown panel positioned over the existing div */}
                                <div
                                    className="z-[9999] bg-white border rounded-lg shadow-xl py-2 flex flex-col gap-1"
                                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width }}
                                >
                                    <button
                                        className="px-4 py-3 text-left flex flex-row gap-2 items-center hover:bg-gray-100"
                                        onClick={() => { setShowLinkInput(true); setShowAddCard(false); }}
                                    >
                                        <Link2/> Link
                                    </button>
                                    <button
                                        className="px-4 py-3 text-left flex flex-row gap-2 items-center hover:bg-gray-100"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <Paperclip/> Arquivo
                                    </button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept={allowedFileTypes.join(',')}
                                        style={{ display: 'none' }}
                                        onChange={e => handleFileSelect(e.target.files)}
                                    />
                                </div>
                            </>,
                            document.body
                        )}

                        <button
                            className={`w-full py-2 px-4 rounded-full flex justify-center items-center border-2 transition-colors ${ (canSubmit || canResubmit) ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                            onClick={handleSubmit}
                            disabled={!canSubmit && !canResubmit || isSubmitting || filePreviews.filter(p => p.type === 'file').length === 0}
                        >
                            {isSubmitting ? 'Enviando...' : currentSubmitted ? 'Reenviar' : 'Enviar'}
                        </button>

                        {(isDeadlinePassed && !allowLateSubmission) && (
                            <i className="text-gray-500 text-xs text-center">Não é possível entregar atividades<br />após a data de entrega</i>
                        )}

                    </div>
                </div>

            </div>
            {showLinkInput && typeof window !== "undefined" && ReactDOM.createPortal(
                <>
                    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999 }} onClick={() => { setShowLinkInput(false); setLinkValue(""); setLinkError(""); }}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative gap-3 flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <span>Adicionar link</span>
                            <input type="text" value={linkValue} onChange={(e) => { setLinkValue(e.target.value); setLinkError(""); }} onBlur={() => { if (linkValue && !isValidUrl(linkValue)) setLinkError("Insira um link válido"); }} placeholder="Link*" className={`border-b-2 p-3 rounded w-full bg-gray-100 focus:outline-none focus:ring-0 ${linkError ? "border-red-500 text-red-600" : ""}`} />
                            {linkError && <span className="text-xs pt-1 text-red-500 mt-[-12px] mb-2 pl-3">{linkError}</span>}
                            <div className="flex flex-row gap-3 justify-end px-2 mt-8">
                                <button className="text-blue-500" onClick={() => { setShowLinkInput(false); setLinkValue(""); setLinkError(""); }}>Cancelar</button>
                                <button className={`${!linkError && linkValue && isValidUrl(linkValue) ? "text-blue-500" : "text-gray-300"}`} onClick={() => {
                                    if (!isValidUrl(linkValue)) { setLinkError("Insira um link válido"); return; }
                                    setFilePreviews(prev => [...prev, { type: 'link', url: linkValue, title: linkValue }]);
                                    setShowLinkInput(false);
                                    setLinkValue("");
                                    setLinkError("");
                                }}>Adicionar link</button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}