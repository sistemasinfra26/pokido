"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export function HeroSection() {
    const [aforoActual, setAforoActual] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCapacity() {
            const res = await getDashboardData()
            if (res.success && res.data) {
                setAforoActual(res.data.kpis?.aforoActual || 0)
            }
            setLoading(false)
        }
        fetchCapacity()
    }, [])

    const cuposDisponibles = Math.max(0, PARK_TOTAL_MAX_CAPACITY - aforoActual)

    return (
        <section className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">

                {/* INDICADOR DE AFORO EN VIVO */}
                <div className="inline-flex items-center gap-2 bg-pokido-green/10 border border-pokido-green/20 px-4 py-2 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-pokido-green animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">
                        Disponibilidad en vivo:{" "}
                        <strong className="text-pokido-green font-black">
                            {loading ? "Cargando..." : `${cuposDisponibles} cupos libres ahora`}
                        </strong>
                    </span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
                    El Parque de Trampolines más <span className="text-pokido-purple">Épico</span>
                </h1>

                <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                    Disfruta de la mejor experiencia de salto. Compra tu pase online, selecciona tu horario preferido y evita filas en caja.
                </p>

                {/* BOTONES PRINCIPALES */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                    <Link
                        href="/reserva"
                        className="bg-pokido-purple hover:bg-pokido-purple/90 text-white font-black px-8 py-4 rounded-2xl text-center transition shadow-xl shadow-pokido-purple/20 text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>🎟️</span> RESERVAR TURNO ONLINE
                    </Link>

                    <Link
                        href="/dashboard/parties"
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-6 py-4 rounded-2xl text-center transition text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                        <span>🎉</span> Cumpleaños y Eventos
                    </Link>
                </div>
            </div>

            {/* TARJETA DESTACADA EN TEMA CLARO */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-pokido-purple/10 rounded-full blur-3xl pointer-events-none" />

                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>⚡</span> Compra Inteligente
                </h3>

                <ul className="space-y-4 text-xs font-semibold text-slate-600">
                    <li className="flex items-start gap-3">
                        <span className="text-pokido-cyan font-black text-base">✓</span>
                        <span><strong>Cupo reservado:</strong> Eliges tu turno exacto de ingreso de 30, 60, 90 o 120 minutos.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-pokido-cyan font-black text-base">✓</span>
                        <span><strong>Waiver digital:</strong> Declaración jurada firmada online previamente.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="text-pokido-cyan font-black text-base">✓</span>
                        <span><strong>Acceso por QR:</strong> Llegas a recepción, escaneas tu código y te entregamos tu pulsera.</span>
                    </li>
                </ul>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase block">Pases desde</span>
                        <span className="text-xl font-black text-pokido-green">$5.000</span>
                    </div>
                    <Link
                        href="/reserva"
                        className="bg-pokido-cyan hover:bg-pokido-cyan/90 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-pokido-cyan/20 cursor-pointer"
                    >
                        Comprar Entrada
                    </Link>
                </div>
            </div>
        </section>
    )
}