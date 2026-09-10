"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getTicketTypes } from "@/app/actions/ticketTypeActions"

interface TicketTypeItem {
    id: string
    name: string
    durationMinutes: number
    price: number
}

export function PricingSection() {
    const [ticketTypes, setTicketTypes] = useState<TicketTypeItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadTypes() {
            const res = await getTicketTypes()
            const typesArray = res.success ? (res.ticketTypes || (res as any).data) : null

            if (typesArray) {
                const formatted = typesArray.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    durationMinutes: item.durationMinutes,
                    price: Number(item.price),
                }))
                setTicketTypes(formatted)
            }
            setLoading(false)
        }
        loadTypes()
    }, [])

    const getColorByDuration = (duration: number) => {
        if (duration <= 30) return "text-pokido-cyan bg-pokido-cyan/10 border-pokido-cyan/20"
        if (duration <= 60) return "text-pokido-purple bg-pokido-purple/10 border-pokido-purple/20"
        if (duration <= 90) return "text-pokido-orange bg-pokido-orange/10 border-pokido-orange/20"
        return "text-pokido-red bg-pokido-red/10 border-pokido-red/20"
    }

    if (loading) {
        return (
            <section className="max-w-7xl mx-auto px-6 py-16 text-center">
                <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">
                    Cargando tarifas oficiales...
                </p>
            </section>
        )
    }

    return (
        <section className="max-w-7xl mx-auto px-6 py-16 space-y-10">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Tarifas de Pases</h2>
                <p className="text-slate-500 text-xs font-medium">
                    Elige el tiempo de diversión que prefieras para tu visita
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {ticketTypes.map((item) => {
                    const isPopular = item.durationMinutes === 60
                    const colorBadgeClass = getColorByDuration(item.durationMinutes)

                    return (
                        <div
                            key={item.id}
                            className={`bg-white p-6 rounded-3xl border space-y-4 relative flex flex-col justify-between shadow-sm ${isPopular
                                    ? "border-pokido-purple ring-2 ring-pokido-purple/20"
                                    : "border-slate-200"
                                }`}
                        >
                            {isPopular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pokido-purple text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    Más Elegido
                                </span>
                            )}

                            <div className="space-y-3">
                                <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${colorBadgeClass}`}>
                                    {item.name}
                                </span>
                                <div className="text-3xl font-black text-slate-900">
                                    ${item.price.toLocaleString("es-CL")}
                                </div>
                            </div>

                            <Link
                                href={`/reserva?duration=${item.durationMinutes}`}
                                className={`w-full py-3 rounded-2xl text-center font-black text-xs transition cursor-pointer ${isPopular
                                        ? "bg-pokido-purple text-white hover:bg-pokido-purple/90 shadow-md shadow-pokido-purple/20"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                            >
                                Reservar Turno
                            </Link>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}