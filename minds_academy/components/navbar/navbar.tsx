import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between p-4 bg-[rgba(136,113,172,0.2)] m-4 rounded-lg  ">
            <Image
                src="logo_navbar.svg"
                alt="Minds Academy Logo"
                width={50}
                height={50}
                className="mr-4 transition-all duration-300 hover:scale-110"
            />

            <ul className="flex space-x-4">
                <li>
                    <a href="/login" className="bold text-2xl transition-all duration-300 hover:text-[26px]">
                        Login
                    </a>
                </li>
            </ul>
        </nav>
    );
}