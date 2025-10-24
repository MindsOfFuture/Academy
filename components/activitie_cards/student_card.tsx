import { LucideX, Paperclip } from "lucide-react";

interface Student_CardProps{
    link: string;
    StudentTitleLink: string;
    onDelete?: () => void;
}

export default function Student_Card({link, StudentTitleLink, onDelete}:Student_CardProps) {  
    const repoLink = link;

    const isBlob = typeof repoLink === 'string' && repoLink.startsWith('blob:');
    let faviconUrl = '';
    try {
        if (!isBlob) {
            const url = new URL(repoLink);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;
        }
    } catch {
        faviconUrl = '';
    }

    // Inferir extensão do arquivo a partir do título para decidir se é imagem
    const ext = StudentTitleLink.split('.').pop()?.toLowerCase();
    const imageExts = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);
    const isImageFile = isBlob && !!ext && imageExts.has(ext);
   
    function truncate(str: string, max: number) {
    return str.length > max ? str.slice(0, max) : str;
}


    return (
        <div className="w-full">
            <div
                className="w-full border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer px-3"
                role="link"
                tabIndex={0}
                onClick={() => {
                    try { window.open(repoLink, '_blank', 'noopener,noreferrer'); } catch {}
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        try { window.open(repoLink, '_blank', 'noopener,noreferrer'); } catch {}
                    }
                }}
            >
                    <div className="flex items-center gap-3 w-full min-h-[64px]">
                        <div className="w-16 p-0 flex items-center justify-center">
                            {isBlob ? (
                                
                                <>
                                    {isImageFile ? (
                                        <img
                                            src={repoLink}
                                            alt={StudentTitleLink}
                                            className="w-12 h-12 object-cover rounded mr-2"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded mr-2">
                                            {ext ? (
                                                <span className="text-[10px] font-semibold uppercase text-gray-700">.{ext}</span>
                                            ) : (
                                                <Paperclip className="w-5 h-5 text-gray-600" />
                                            )}
                                        </div>
                                    )}
                                    <div className="h-10 w-px bg-gray-300" />
                                </>
                            ) : (
                                // Link externo com favicon
                                <>
                                    <img
                                        src={faviconUrl}
                                        alt="Favicon"
                                        width={48}
                                        height={48}
                                        className="object-contain mr-2"
                                    />
                                    <div className="h-10 w-px bg-gray-300" />
                                </>
                            )}
                        </div>

                        

                        <div className="py-3 flex-1 min-w-0">
                            <span className="text-base font-semibold">
                                {truncate(StudentTitleLink, 17)}
                            </span>
                            <p className="text-gray-600 text-sm">
                                {truncate(repoLink, 25)}
                            </p>
                        </div>
                        <div 
                            className="p-1 mr-3 ml-auto shrink-0 cursor-pointer hover:bg-gray-200 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDelete?.();
                            }}
                        >
                            <LucideX/>
                        </div>
                    </div>
            </div>
        </div>
    );
}