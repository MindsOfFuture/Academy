import Image from "next/image";
import { FileText } from "lucide-react";

interface Teacher_CardProps {
    link: string;
    titleLink: string;
}

function isValidUrl(str: string): boolean {
    if (!str || str.trim() === "") return false;
    try {
        new URL(str.startsWith("http") ? str : `https://${str}`);
        return true;
    } catch {
        return false;
    }
}

export default function Teacher_Card({ link, titleLink }: Teacher_CardProps) {
    const repoLink = link;
    const hasValidLink = isValidUrl(repoLink);

    let faviconUrl = "";
    if (hasValidLink) {
        try {
            const url = new URL(repoLink.startsWith("http") ? repoLink : `https://${repoLink}`);
            faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;
        } catch {
            faviconUrl = "";
        }
    }

    function truncate(str: string, max: number) {
        return str.length > max ? str.slice(0, max) : str;
    }

    // Se não tiver link válido, não renderiza nada
    if (!hasValidLink) {
        return null;
    }

    return (
        <div className="w-full mb-5">
            <div className="w-fit border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                <a href={repoLink} target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-3 w-fit">
                        <div className="w-16 p-0 flex items-center justify-center">
                            <Image
                                src={faviconUrl}
                                alt="Favicon"
                                width={50}
                                height={50}
                                className="object-contain mr-2"
                            />
                            <div className="h-10 w-px bg-gray-300" />
                        </div>


                        <div className="p-3">
                            <span className="text-base font-semibold">
                                {truncate(titleLink, 17)}
                            </span>
                            <p className="text-gray-600 text-sm">
                                {truncate(repoLink, 25)}
                            </p>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
}