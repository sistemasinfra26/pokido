"use client"

import { useEffect, useState } from "react"

// Interfaz inline para evitar problemas de módulos / rutas
export interface ActiveChild {
    id: string
    wristbandCode: string
    ticketId: string
    minorName: string
    age: number
    medicalNotes?: string
    tutorName: string
    tutorPhone: string
    purchaseTime: string
    slotStartTime: string
    slotEndTime: string
    slotWindow: string
    contractedTime: string
    durationMinutes: number
    rawStartTime: string
    rawEndTime: string
}

interface KpisData {
    aforoMax?: number
    ventasHoy: string
    pedidosTotal: number
    cumpleanosHoy: number
}

interface KpiCardsProps {
    kpis: KpisData
    childrenList?: ActiveChild[]
}

export function KpiCards({ kpis, childrenList = [] }: KpiCardsProps) {
    const [, setTick] = useState(0)

    // Forzar re-render cada 10 segundos para actualizar tiempos en vivo
    useEffect(() => {
        const interval = setInterval(() => {
            setTick((prev) => prev + 1)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const now = new Date()

    // Clasificación dinámica basada en las fechas del turno
    let activeInPark = 0
    let waitingToStart = 0
    let expiredCount = 0

    childrenList.forEach((child) => {
        const start = new Date(child.rawStartTime)
        const end = new Date(child.rawEndTime)

        const msUntilStart = start.getTime() - now.getTime()
        const msUntilEnd = end.getTime() - now.getTime()

        const isWaiting = msUntilStart > 0
        const isExpired = msUntilEnd < 0
        const isPlaying = !isWaiting && !isExpired

        if (isPlaying) activeInPark++
        if (isWaiting) waitingToStart++
        if (isExpired) expiredCount++
    })

    const safeMax = kpis.aforoMax || 90
    const percentage = Math.min(100, Math.round((activeInPark / safeMax) * 100))

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: AFORO REAL EN PARQUE */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    En Parque Ahora (Pista)
                </span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                    {activeInPark}{" "}
                    <span className="text-sm font-normal text-slate-400">/ {safeMax}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden border border-slate-200/50">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${percentage >= 90
                                ? "bg-pokido-red"
                                : percentage >= 75
                                    ? "bg-pokido-orange"
                                    : "bg-pokido-green"
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {waitingToStart > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 mt-2 block">
                        ⏳ {waitingToStart} niño(s) comprados en espera
                    </span>
                )}
            </div>

            {/* KPI 2: VENTAS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Ventas del Día
                </span>
                <div className="text-3xl font-black text-pokido-green mt-1">
                    {kpis.ventasHoy}
                </div>
                <span className="text-xs text-slate-400 mt-2 block font-medium">
                    {kpis.pedidosTotal} transacciones procesadas
                </span>
            </div>

            {/* KPI 3: CUMPLEAÑOS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Cumpleaños Hoy
                </span>
                <div className="text-3xl font-black text-pokido-purple mt-1">
                    {kpis.cumpleanosHoy} Eventos
                </div>
                <span className="text-xs text-pokido-purple font-semibold mt-2 block">
                    Salones reservados
                </span>
            </div>

            {/* KPI 4: TIEMPOS EXCEDIDOS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Tiempos Excedidos
                </span>
                <div className="text-3xl font-black text-pokido-red mt-1">
                    {expiredCount} Niños
                </div>
                <span className="text-xs text-pokido-red font-semibold mt-2 block">
                    {expiredCount > 0 ? "⚠️ Requieren cobro de recargo" : "✓ Todo en orden"}
                </span>
            </div>
        </div>
    )
}