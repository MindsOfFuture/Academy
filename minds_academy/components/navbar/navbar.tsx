import Image from "next/image";

export default function Navbar({ showTextLogo }: { showTextLogo: boolean }) {
    return (
        <nav className=" flex items-center justify-between rounded-b-lg  bg-[#684A97] sticky top-0 z-10 p-4 pl-7 pr-7 shadow-lg backdrop-blur-3xl text-white">
            <div className="flex items-center transition-all duration-300 hover:text-[26px] hover:scale-105 ">
                <Image
                    src="logo_navbar.svg"
                    alt="Minds Academy Logo"
                    width={50}
                    height={50}
                    className="mr-2"
                />
                {showTextLogo && (
                    <a href="/" className="text-2xl font-bold">
                        Minds of the Future
                    </a>
                )}
            </div>
            <a href="/login" className="bold text-2xl  transition-all duration-300 hover:text-[26px]">
                Login
            </a>
        </nav>
    );
}