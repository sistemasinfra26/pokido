"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getPartyRoomsData } from "@/app/actions/partyActions"
import { PartyRoomShowcase } from "@/app/dashboard/parties/components/PartyRoomShowCase"

export function PartiesSection() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadRooms() {
            const res = await getPartyRoomsData()
            if (res.success && res.rooms) {
                setRooms(res.rooms as any[])
            }
            setLoading(false)
        }
        loadRooms()
    }, [])

    return (
        <section id="cumpleanos" className="py-20 bg-slate-100/70 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* CABECERA DE LA SECCIÓN */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <div className="inline-flex items-center gap-2 bg-pokido-purple/10 text-pokido-purple px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-pokido-purple/20">
                        <span>🎉</span> Eventos Inolvidables
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        Salones Privados para <span className="text-pokido-purple">Cumpleaños</span>
                    </h2>

                    <p className="text-slate-600 text-base font-medium">
                        Espacios temáticos acondicionados con salones VIP, mesas para invitados y reserva directa de cupos en parque.
                    </p>
                </div>

                {/* SHOWCASE / CATÁLOGO DE SALONES */}
                {loading ? (
                    <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
                        Cargando catálogo de salones...
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="space-y-8">
                        <PartyRoomShowcase roomsInfo={rooms} />

                        {/* CTA RESERVAS CUMPLEAÑOS */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900">¿Quieres agendar un cumpleaños?</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Consulta disponibilidad de fechas y salones VIP directamente en la administración.
                                </p>
                            </div>

                            <Link
                                href="/dashboard/parties"
                                className="bg-pokido-purple hover:bg-pokido-purple/90 text-white font-black px-6 py-3.5 rounded-2xl transition text-xs shadow-lg shadow-pokido-purple/20 cursor-pointer whitespace-nowrap"
                            >
                                Agendar Evento ➔
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500 font-bold">
                        No hay salones de cumpleaños configurados actualmente.
                    </div>
                )}
            </div>
        </section>
    )
}