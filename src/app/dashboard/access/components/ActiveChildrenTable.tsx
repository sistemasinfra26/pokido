"use client"

import { useEffect, useState } from "react"
import { getWristbandColorForTime } from "@/lib/wristbandLogic"

export interface ActiveChild {
    id: string
    wristbandCode: string
    ticketId: string
    minorName: string
    age: number
    medicalNotes?: string
    tutorName: string
    tutorPhone: string
    purchaseTime: string       // "20:07"
    slotStartTime: string      // "20:30"
    slotEndTime: string        // "21:00"
    slotWindow: string         // "20:30 - 21:00 hs"
    contractedTime: string     // "30 min"
    durationMinutes: number
    rawStartTime: string
    rawEndTime: string
}

interface ActiveChildrenTableProps {
    childrenList: ActiveChild[]
    onCheckout?: (child: ActiveChild) => void
}

export function ActiveChildrenTable({ childrenList = [], onCheckout }: ActiveChildrenTableProps) {
    const [, setTick] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setTick((prev) => prev + 1)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    if (childrenList.length === 0) {
        return (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">
                No hay niños registrados para los turnos de hoy.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <th className="py-4 px-6">Niño / Pulsera</th>
                        <th className="py-4 px-6">Tutor / Teléfono</th>
                        <th className="py-4 px-6">Turno Reservado / Color</th>
                        <th className="py-4 px-6">Emisión en Caja</th>
                        <th className="py-4 px-6">Estado del Pase</th>
                        <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {childrenList.map((child) => {
                        const now = new Date()
                        const start = new Date(child.rawStartTime)
                        const end = new Date(child.rawEndTime)

                        const msUntilStart = start.getTime() - now.getTime()
                        const msUntilEnd = end.getTime() - now.getTime()

                        const minutesUntilStart = Math.round(msUntilStart / 60000)
                        const minutesRemaining = Math.round(msUntilEnd / 60000)

                        // Evaluación de Estado
                        const isWaiting = minutesUntilStart > 0
                        const isExpired = minutesRemaining < 0
                        const isPlaying = !isWaiting && !isExpired

                        const extraMinutes = isExpired ? Math.abs(minutesRemaining) : 0
                        const extraCharge = extraMinutes > 0 ? Math.ceil(extraMinutes / 15) * 1500 : 0

                        const colorObj = getWristbandColorForTime(child.slotStartTime, child.durationMinutes)

                        return (
                            <tr key={child.id} className="hover:bg-slate-50/80 transition">
                                {/* NIÑO Y PULSERA */}
                                <td className="py-4 px-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full bg-pokido-purple/15 text-pokido-purple font-black flex items-center justify-center text-xs shrink-0 mt-0.5 border border-pokido-purple/20">
                                            {child.minorName?.charAt(0) || "N"}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 leading-tight">{child.minorName}</div>
                                            <div className="text-xs text-slate-400 font-mono font-bold mt-0.5">{child.wristbandCode}</div>
                                            {child.medicalNotes && (
                                                <span className="inline-block mt-1 text-[10px] font-bold bg-pokido-orange/10 text-pokido-orange border border-pokido-orange/20 px-2 py-0.5 rounded">
                                                    ⚠️ {child.medicalNotes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* TUTOR */}
                                <td className="py-4 px-6">
                                    <div className="font-bold text-slate-800">{child.tutorName}</div>
                                    <div className="text-xs text-slate-400">{child.tutorPhone}</div>
                                </td>

                                {/* TURNO RESERVADO Y COLOR */}
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <div className="space-y-1">
                                        <div className="text-xs font-black text-slate-900">
                                            🕒 Turno: {child.slotWindow}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${colorObj.badgeClass}`}>
                                                <span className={`w-2 h-2 rounded-full ${colorObj.bgClass}`} />
                                                {colorObj.label} (Color {colorObj.id})
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {child.contractedTime}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* EMISIÓN EN CAJA */}
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <div className="text-xs text-slate-500 font-semibold">
                                        💳 Cobrado a las {child.purchaseTime} hs
                                    </div>
                                </td>

                                {/* ESTADO INTELIGENTE DEL PASE */}
                                <td className="py-4 px-6 whitespace-nowrap">
                                    {/* ESTADO 1: EN ESPERA */}
                                    {isWaiting && (
                                        <div>
                                            <div className="font-bold text-amber-600 text-sm">
                                                Comienza en {minutesUntilStart} min
                                            </div>
                                            <span className="inline-block text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
                                                ⏳ En Espera
                                            </span>
                                        </div>
                                    )}

                                    {/* ESTADO 2: JUGANDO EN PISTA */}
                                    {isPlaying && (
                                        <div>
                                            <div className="font-black text-slate-900 text-base">
                                                {minutesRemaining} min
                                            </div>
                                            <span className="inline-block text-[10px] font-extrabold text-pokido-green bg-pokido-green/10 border border-pokido-green/20 px-2.5 py-0.5 rounded-full uppercase">
                                                🟢 En Pista
                                            </span>
                                        </div>
                                    )}

                                    {/* ESTADO 3: TIEMPO EXCEDIDO */}
                                    {isExpired && (
                                        <div>
                                            <div className="font-black text-pokido-red text-base animate-pulse">
                                                -{extraMinutes} min
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-pokido-red/10 text-pokido-red border border-pokido-red/20 px-2.5 py-0.5 rounded-full uppercase">
                                                ⚠️ Excedido (+${extraCharge.toLocaleString("es-CL")})
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {/* ACCIONES */}
                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                                        >
                                            + Extender
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onCheckout && onCheckout(child)}
                                            className="bg-pokido-red hover:bg-pokido-red/90 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm shadow-pokido-red/20 cursor-pointer"
                                        >
                                            ↪ Check-out
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}