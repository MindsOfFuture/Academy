"use client";
interface ButtonProps {
    Texto: string;
    Link: string;
}
export default function Button({ Texto, Link }: ButtonProps) {
    return (
        <button onClick={() => window.location.href = Link} className="bg-[rgba(168,163,177,0.17)] text-black text-3xl font-bold py-4 px-8 rounded transition-all duration-300 hover:text-[33px] hover:bg-[rgba(168,163,177,0.3)]">
            {Texto}
        </button>
    );

}