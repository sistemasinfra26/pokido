"use client"

import Link from "next/link"
import { useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

export function Navbar() {
    const { isLoaded, isSignedIn } = useAuth()

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

                {/* BRANDING LOGO */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-3xl font-black tracking-wider text-pokido-purple transition group-hover:opacity-90">
                        POKIDDO
                    </span>
                    <span className="text-xs bg-pokido-purple/10 text-pokido-purple px-2 py-1 rounded-full font-extrabold uppercase border border-pokido-purple/20">
                        Park
                    </span>
                </Link>

                {/* NAVEGACIÓN PRINCIPAL */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
                    <Link href="#atracciones" className="hover:text-pokido-purple transition">
                        Atracciones
                    </Link>
                    <Link href="#precios" className="hover:text-pokido-purple transition">
                        Pases
                    </Link>
                    <Link href="/dashboard/parties" className="hover:text-pokido-purple transition">
                        Cumpleaños
                    </Link>
                    <Link href="/reserva" className="hover:text-pokido-purple transition">
                        Firmar Waiver
                    </Link>
                </nav>

                {/* ACCIONES Y AUTENTICACIÓN */}
                <div className="flex items-center gap-3">

                    {/* BOTÓN COMPRAR PASES (PÚBLICO) */}
                    <Link
                        href="/reserva"
                        className="bg-pokido-orange hover:bg-pokido-orange/90 text-white px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black transition shadow-md shadow-pokido-orange/20 tracking-wide uppercase cursor-pointer"
                    >
                        Comprar Pases
                    </Link>

                    {/* ESTADO DE SESIÓN CON HOOK DE CLERK */}
                    {!isLoaded ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                    ) : !isSignedIn ? (
                        <>
                            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                                <button className="text-xs font-extrabold text-slate-700 hover:text-pokido-purple px-3 py-2 transition cursor-pointer">
                                    Iniciar Sesión
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                                <button className="bg-pokido-purple hover:bg-pokido-purple/90 text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-md shadow-pokido-purple/20 cursor-pointer">
                                    Registrarse
                                </button>
                            </SignUpButton>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                            {/* BOTÓN ACCESO DIRECTO AL DASHBOARD CUANDO YA ESTÁ LOGUEADO */}
                            <Link
                                href="/dashboard"
                                className="text-xs font-black text-pokido-purple hover:underline bg-pokido-purple/10 px-3 py-2 rounded-xl border border-pokido-purple/20"
                            >
                                Panel ➔
                            </Link>

                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 rounded-full border-2 border-pokido-purple/30"
                                    }
                                }}
                            />
                        </div>
                    )}

                </div>
            </div>
        </header>
    )
}