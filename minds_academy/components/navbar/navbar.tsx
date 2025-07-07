import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="m-4 flex items-center justify-between rounded-2xl  bg-[rgba(136,113,172,0.4)] sticky top-4 z-10 p-4 shadow-lg backdrop-blur-3xl">
            <Image
                src="logo_navbar.svg"
                alt="Minds Academy Logo"
                width={50}
                height={50}
                className="mr-4 transition-all duration-300 hover:scale-110"
            />

            <a href="/login" className="bold text-2xl  transition-all duration-300 hover:text-[26px]">
                Login
            </a>
        </nav>
    );
}