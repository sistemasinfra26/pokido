"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWristbandColorForTime, WRISTBAND_COLORS } from "@/lib/wristbandLogic"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export interface TimeSlotRow {
    timeStr: string
    color30Min: number
    color60Min: number
    expiringColor: number
    bookedCount?: number
    capacity?: number
}

const timeSlotsList = [
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30",
]

// 🔑 Convierte "HH:MM" a minutos desde medianoche para comparación exacta
function timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
}

interface TimeSlotSchedulerProps {
    onSelectSlot?: (timeStr: string, duration: number, colorId: number) => void
    isInteractive?: boolean
    capacityPerSlot?: number
    occupancyData?: Record<string, number>
}

export function TimeSlotScheduler({
    onSelectSlot,
    isInteractive = true,
    capacityPerSlot = PARK_TOTAL_MAX_CAPACITY,
    occupancyData = {},
}: TimeSlotSchedulerProps) {
    const router = useRouter()
    const [currentMinutes, setCurrentMinutes] = useState<number>(0)

    // 🔑 Mantiene la hora actual sincronizada cada minuto
    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date()
            setCurrentMinutes(now.getHours() * 60 + now.getMinutes())
        }

        updateCurrentTime()
        const interval = setInterval(updateCurrentTime, 60000) // Actualiza cada minuto
        return () => clearInterval(interval)
    }, [])

    const handleSlotClick = (timeStr: string, duration: number, colorId: number) => {
        if (!isInteractive) return
        if (onSelectSlot) {
            onSelectSlot(timeStr, duration, colorId)
        } else {
            router.push(`/dashboard/pos?time=${encodeURIComponent(timeStr)}&duration=${duration}`)
        }
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            {/* CABECERA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <span>🕒</span> Disponibilidad y Rotación de Pulseras
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Selecciona un bloque horario activo para emitir pases directamente en el POS
                    </p>
                </div>

                {/* LEYENDA VISUAL */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((id) => {
                        const col = WRISTBAND_COLORS[id]
                        return (
                            <span
                                key={id}
                                title={`Color ${id}`}
                                className={`w-6 h-6 rounded-full border shadow-sm flex items-center justify-center ${col.bgClass} ${col.borderClass}`}
                            />
                        )
                    })}
                </div>
            </div>

            {/* TABLA CON BARRAS DE CAPACIDAD Y BLOQUEO POR HORA PASADA */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 font-extrabold text-slate-700 uppercase tracking-wider z-10 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4">Hora Ingreso</th>
                            <th className="py-3 px-4 min-w-[180px]">Capacidad / Ocupación</th>
                            <th className="py-3 px-4 text-center">Pase 30 Min</th>
                            <th className="py-3 px-4 text-center">Pase 1 Hora</th>
                            <th className="py-3 px-4 text-center">🔴 Salida del Parque</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {timeSlotsList.map((timeStr) => {
                            const c30 = getWristbandColorForTime(timeStr, 30)
                            const c60 = getWristbandColorForTime(timeStr, 60)

                            const shortKey = timeStr.slice(0, 5)
                            const booked = occupancyData[shortKey] || occupancyData[timeStr] || 0

                            const percentage = Math.min(100, Math.round((booked / capacityPerSlot) * 100))
                            const isFull = booked >= capacityPerSlot

                            // 🔑 Evaluamos si el turno ya pasó
                            const slotMinutes = timeToMinutes(timeStr)
                            const isPast = slotMinutes < currentMinutes

                            const prevTime = timeSlotsList[timeSlotsList.indexOf(timeStr) - 1]
                            const cExit = prevTime ? getWristbandColorForTime(prevTime, 30) : null

                            const isDisabled = isFull || isPast

                            return (
                                <tr
                                    key={timeStr}
                                    className={`transition ${isPast ? "bg-slate-50/50 opacity-60" : "hover:bg-slate-50/80"
                                        }`}
                                >
                                    {/* HORA */}
                                    <td className="py-3 px-4 font-black text-slate-900 bg-slate-50/50 whitespace-nowrap">
                                        <span className={isPast ? "line-through text-slate-400" : ""}>
                                            {timeStr} hs
                                        </span>
                                        {isPast && (
                                            <span className="ml-2 text-[9px] font-extrabold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded uppercase">
                                                Finalizado
                                            </span>
                                        )}
                                    </td>

                                    {/* BARRA DE CAPACIDAD DINÁMICA */}
                                    <td className="py-3 px-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-slate-600 font-black">
                                                    {booked} / {capacityPerSlot} Niños
                                                </span>
                                                <span
                                                    className={
                                                        isPast
                                                            ? "text-slate-400 font-bold"
                                                            : isFull
                                                                ? "text-pokido-red font-black"
                                                                : percentage > 80
                                                                    ? "text-pokido-orange font-black"
                                                                    : "text-pokido-green font-black"
                                                    }
                                                >
                                                    {isPast ? "EXPIRADO" : isFull ? "COMPLETO" : `${capacityPerSlot - booked} libres`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isPast
                                                            ? "bg-slate-300"
                                                            : isFull
                                                                ? "bg-pokido-red"
                                                                : percentage > 80
                                                                    ? "bg-pokido-orange"
                                                                    : "bg-pokido-green"
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* PASE 30 MIN */}
                                    <td className="py-2 px-3 text-center">
                                        <button
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => handleSlotClick(timeStr, 30, c30.id)}
                                            className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${c30.badgeClass
                                                } ${!isDisabled
                                                    ? "hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                                    : "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                                                }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full ${c30.bgClass} border border-black/10 shadow-sm ${isPast ? "grayscale" : ""}`} />
                                        </button>
                                    </td>

                                    {/* PASE 1 HORA (60 MIN) */}
                                    <td className="py-2 px-3 text-center">
                                        <button
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => handleSlotClick(timeStr, 60, c60.id)}
                                            className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${c60.badgeClass
                                                } ${!isDisabled
                                                    ? "hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                                    : "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                                                }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded-full ${c60.bgClass} border border-black/10 shadow-sm ${isPast ? "grayscale" : ""}`} />
                                        </button>
                                    </td>

                                    {/* SALIDA */}
                                    <td className="py-2 px-3 text-center">
                                        {cExit ? (
                                            <div className="flex justify-center">
                                                <span
                                                    className={`w-6 h-6 rounded-full border shadow-sm inline-block ${cExit.bgClass} ${cExit.borderClass} ${isPast ? "grayscale opacity-40" : ""}`}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}