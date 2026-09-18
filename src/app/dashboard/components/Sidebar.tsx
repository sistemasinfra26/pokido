"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useClerk, useUser } from "@clerk/nextjs"

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const { signOut } = useClerk()
    const { user } = useUser()

    // 1. Obtener y normalizar el rol del usuario a mayúsculas
    const rawRole = (user?.publicMetadata as any)?.role || "CASHIER"
    const userRole = String(rawRole).toUpperCase()

    // 2. Mapeo de etiquetas legibles para la interfaz
    const ROLE_DISPLAY_NAMES: Record<string, string> = {
        ADMIN: "Administrador/a",
        SUPERADMIN: "Super Admin",
        MANAGER: "Gerente / Encargado/a",
        CASHIER: "Cajero/a (POS)",
        CAJERA: "Cajero/a (POS)",
        STAFF: "Operario/a de Pista",
        OPERADOR: "Operario/a de Pista",
    }

    // 3. Menú de navegación con íconos SVG vectoriales y roles
    const navigation = [
        {
            name: "Dashboard",
            href: "/dashboard",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "CASHIER", "STAFF", "admin", "cajera", "operador"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: "Control de Accesos",
            href: "/dashboard/access",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "CASHIER", "STAFF", "admin", "cajera", "operador"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            )
        },
        {
            name: "Punto de Venta (POS)",
            href: "/dashboard/pos",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "CASHIER", "admin", "cajera"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            name: "Historial y Auditoría",
            href: "/dashboard/history",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "admin"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            name: "Cumpleaños y Salones",
            href: "/dashboard/parties",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "CASHIER", "admin", "cajera"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M3 21h18M3 10h18v11H3V10z" />
                </svg>
            )
        },
        {
            name: "Clientes y Waivers",
            href: "/dashboard/customers",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "CASHIER", "STAFF", "admin", "cajera", "operador"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            name: "Gestión de Personal",
            href: "/dashboard/users",
            roles: ["ADMIN", "SUPERADMIN", "admin"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            name: "Configuración y Tarifas",
            href: "/dashboard/settings",
            roles: ["ADMIN", "SUPERADMIN", "MANAGER", "admin"],
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ]

    // 4. Filtrar ítems visibles
    const visibleNavigation = navigation.filter(item =>
        item.roles.includes(userRole) || item.roles.includes(String(rawRole))
    )

    return (
        <>
            {/* BARRA MÓVIL SUPERIOR */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-purple-900/40 px-4 flex items-center justify-between z-40">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-xl font-black text-cyan-400 tracking-wider">POKIDDO</span>
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold uppercase border border-cyan-400/20">
                        {ROLE_DISPLAY_NAMES[userRole] || userRole}
                    </span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-purple-200 hover:text-white bg-purple-950/80 rounded-xl border border-purple-800/50 cursor-pointer"
                    aria-label="Abrir menú"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* OVERLAY MÓVIL */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
                />
            )}

            {/* CONTENEDOR SIDEBAR (PALETA PÓKIDDO PURPLE & CYAN) */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-purple-900/40 flex flex-col justify-between transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div>
                    {/* CABECERA BRANDING */}
                    <div className="h-20 px-6 items-center border-b border-purple-900/40 hidden lg:flex justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-wider text-cyan-400">POKIDDO</span>
                            <span className="text-[10px] bg-cyan-400/10 text-cyan-300 px-2 py-0.5 rounded-full font-bold uppercase border border-cyan-400/20">
                                {ROLE_DISPLAY_NAMES[userRole] || userRole}
                            </span>
                        </Link>
                    </div>

                    {/* MENÚ DE NAVEGACIÓN */}
                    <nav className="p-4 space-y-1.5 pt-20 lg:pt-4">
                        {visibleNavigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 ${isActive
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black border border-purple-400/30"
                                            : "text-slate-400 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-800/30"
                                        }`}
                                >
                                    <span className={`${isActive ? "text-cyan-300" : "text-purple-400/80"}`}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* USUARIO Y LOGOUT */}
                <div className="p-4 border-t border-purple-900/40 space-y-2 bg-slate-950">
                    <div className="flex items-center gap-3 p-2.5 bg-purple-950/40 rounded-2xl border border-purple-800/30">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 rounded-xl border border-cyan-400/40 shadow-sm"
                                }
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                            </p>
                            <p className="text-[10px] text-cyan-400/90 capitalize truncate font-medium">
                                {ROLE_DISPLAY_NAMES[userRole] || userRole}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ redirectUrl: "/" })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    )
}