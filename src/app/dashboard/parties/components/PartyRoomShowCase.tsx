"use client"

import { useState } from "react"

export interface PartyRoomRealData {
    id: string
    name: string
    capacity: number
    description?: string | null
    imageUrl?: string | null
    recommendedFor?: string | null
    includes?: string[] | null
}

interface PartyRoomShowcaseProps {
    roomsInfo?: PartyRoomRealData[]
    onSelectRoomToBook?: (roomId: string) => void
}

const DEFAULT_IMAGE_FALLBACK =
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80"

export function PartyRoomShowcase({
    roomsInfo = [],
    onSelectRoomToBook,
}: PartyRoomShowcaseProps) {
    const [selectedRoomModal, setSelectedRoomModal] = useState<PartyRoomRealData | null>(null)

    if (!roomsInfo || roomsInfo.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-medium shadow-sm">
                No hay salones configurados actualmente en la base de datos.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>🎪</span> Salones de Cumpleaños y Eventos
                    </h2>
                    <p className="text-xs text-slate-500">
                        Conoce las características, capacidad e inclusiones de nuestros salones temáticos.
                    </p>
                </div>
            </div>

            {/* GRILLA DINÁMICA DE SALONES DESDE LA BASE DE DATOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roomsInfo.map((room) => {
                    const imgUrl = room.imageUrl || DEFAULT_IMAGE_FALLBACK
                    const includesList = Array.isArray(room.includes) ? room.includes : []

                    return (
                        <div
                            key={room.id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                        >
                            <div>
                                {/* IMAGEN DEL SALÓN */}
                                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                                    <img
                                        src={imgUrl}
                                        alt={room.name}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-black border border-white/10">
                                        👑 Hasta {room.capacity} Niños
                                    </div>
                                </div>

                                {/* CONTENIDO Y CARACTERÍSTICAS */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg leading-snug">
                                            {room.name}
                                        </h3>
                                        <span className="text-[11px] font-bold text-pokido-purple bg-pokido-purple/10 border border-pokido-purple/20 px-2.5 py-0.5 rounded-md inline-block mt-1">
                                            {room.recommendedFor || `Para grupos de hasta ${room.capacity} niños`}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {room.description || "Sin descripción asignada."}
                                    </p>

                                    {/* LISTA DE INCLUSIONES REALES */}
                                    {includesList.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                                                ¿Qué incluye el salón?
                                            </span>
                                            <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                                                {includesList.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-pokido-green font-black">✓</span>
                                                        <span className="leading-tight">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ACCIONES */}
                            <div className="p-6 pt-0 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => onSelectRoomToBook && onSelectRoomToBook(room.id)}
                                    className="w-full bg-pokido-purple hover:bg-pokido-purple/90 text-white font-extrabold py-3 rounded-2xl transition text-xs shadow-md shadow-pokido-purple/20 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>🎉</span> Agendar en este Salón
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoomModal(room)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl transition text-xs cursor-pointer"
                                >
                                    🔍 Ver Detalles Completos
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL DETALLE DE SALÓN */}
            {selectedRoomModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="relative h-56 w-full">
                            <img
                                src={selectedRoomModal.imageUrl || DEFAULT_IMAGE_FALLBACK}
                                alt={selectedRoomModal.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setSelectedRoomModal(null)}
                                className="absolute top-3 right-3 bg-slate-900/80 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:bg-slate-900"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <h3 className="font-black text-slate-900 text-xl">
                                {selectedRoomModal.name}
                            </h3>
                            <p className="text-xs text-slate-600 font-medium">
                                {selectedRoomModal.description || "Sin descripción cargada."}
                            </p>

                            {Array.isArray(selectedRoomModal.includes) &&
                                selectedRoomModal.includes.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-black uppercase text-slate-400">
                                            Servicios e Inclusiones Completas
                                        </span>
                                        <ul className="space-y-2 text-xs font-semibold text-slate-800">
                                            {selectedRoomModal.includes.map((inc, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                                                >
                                                    <span>🎈</span> {inc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoomModal(null)}
                                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl text-xs"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const roomId = selectedRoomModal.id
                                        setSelectedRoomModal(null)
                                        if (onSelectRoomToBook) onSelectRoomToBook(roomId)
                                    }}
                                    className="flex-1 bg-pokido-purple text-white font-bold py-3 rounded-2xl text-xs shadow-md"
                                >
                                    Reservar Salón
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}