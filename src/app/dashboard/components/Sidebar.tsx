"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: "🎛️" },
        { name: "Control de Accesos", href: "/dashboard/access", icon: "🎟️" },
        { name: "Punto de Venta (POS)", href: "/dashboard/pos", icon: "💻" },
        { name: "Cumpleaños y Salas", href: "/dashboard/parties", icon: "🎂" },
        { name: "Clientes y Waivers", href: "/dashboard/customers", icon: "📋" },
        { name: "Configuración y Tarifas", href: "/dashboard/settings", icon: "⚙️" }, // ✅ Nueva ruta agregada
    ]

    return (
        <>
            {/* BARRA MÓVIL SUPERIOR (Solo visible en pantallas pequeñas) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between z-40">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-xl font-black text-amber-400">POKIDDO</span>
                    <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-400/20">
                        Admin
                    </span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
                    aria-label="Abrir menú"
                >
                    {isOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* FONDO OSCURO EN MÓVIL (Overlay al abrir) */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
                />
            )}

            {/* CONTENEDOR DEL SIDEBAR */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div>
                    {/* HEADER DEL SIDEBAR */}
                    <div className="h-20 px-6 items-center border-b border-slate-800 hidden lg:flex justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-wider text-amber-400">POKIDDO</span>
                            <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-400/20">
                                Admin
                            </span>
                        </Link>
                    </div>

                    {/* MENÚ DE NAVEGACIÓN */}
                    <nav className="p-4 space-y-1.5 pt-20 lg:pt-4">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${isActive
                                        ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/10 font-bold"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                                        }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* USUARIO */}
                <div className="p-4 border-t border-slate-900">
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 font-black flex items-center justify-center text-sm border border-amber-400/30">
                            OP
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Operador Pokido</p>
                            <p className="text-[10px] text-slate-500 truncate">Cajero / Staff</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}