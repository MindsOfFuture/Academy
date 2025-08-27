"use client";

import Image from "next/image";
import Link from "next/link";

interface DashboardContentProps {
    userName: string;
    userType?: string;
}

export default function DashboardContent({ userName, userType }: DashboardContentProps) {
    return (
        <div className="flex w-full flex-col min-h-screen bg-gray-50">
            {/* Navbar simplificada */}
            <nav className="flex items-center justify-between rounded-b-lg bg-[#684A97] sticky top-0 z-10 p-4 pl-7 pr-7 shadow-lg text-white">
                <div className="flex items-center">
                    <Image
                        src="/logo_navbar.svg"
                        alt="Minds Academy Logo"
                        width={50}
                        height={50}
                        className="mr-2"
                    />
                    <Link href="/" className="text-lg md:text-2xl font-bold">
                        Minds of the Future
                    </Link>
                </div>
                <div className="text-white">
                    Menu
                </div>
            </nav>

            <div className="flex-grow p-4 sm:p-6 md:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Olá, {userName} ({userType || "usuário"})
                            </h1>
                        </div>
                        <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50">
                            Login
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Seus Cursos</h2>
                                <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                            </div>
                            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                Criar novo curso
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="h-40 bg-yellow-400 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-black">SPIKE</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">LEGO Education SPIKE</h3>
                                    <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                                        Editar curso
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="h-40 bg-yellow-400 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-black">SPIKE</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">LEGO Education SPIKE</h3>
                                    <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                                        Editar curso
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="h-40 bg-yellow-400 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-black">SPIKE</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">LEGO Education SPIKE</h3>
                                    <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                                        Editar curso
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Usuários</h2>
                            <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6">
                                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                                    <span className="text-gray-500">tabela de usuários</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
