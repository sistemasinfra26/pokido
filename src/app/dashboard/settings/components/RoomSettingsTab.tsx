"use client"

import { useState } from "react"
import { upsertPartyRoom } from "@/app/actions/partyActions"
import { PartyRoom } from "../types"

interface RoomSettingsTabProps {
    partyRooms: PartyRoom[]
    onReload: () => void
}

export function RoomSettingsTab({ partyRooms, onReload }: RoomSettingsTabProps) {
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
    const [roomName, setRoomName] = useState("")
    const [roomCapacity, setRoomCapacity] = useState(30)
    const [roomRecommendedFor, setRoomRecommendedFor] = useState("Grupos de 15 a 30 niños")
    const [roomDescription, setRoomDescription] = useState("")
    const [roomImageUrl, setRoomImageUrl] = useState("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80")
    const [roomIncludesText, setRoomIncludesText] = useState("Acceso exclusivo al salón por 3 horas\nMesa de dulces decorada\nServicio de garzón dedicado")

    const handleEditRoom = (room: PartyRoom) => {
        setEditingRoomId(room.id)
        setRoomName(room.name)
        setRoomCapacity(room.capacity)
        setRoomRecommendedFor(room.recommendedFor || "Grupos generales")
        setRoomDescription(room.description || "")
        setRoomImageUrl(room.imageUrl || "")
        setRoomIncludesText(Array.isArray(room.includes) ? room.includes.join("\n") : "")
    }

    const handleResetRoomForm = () => {
        setEditingRoomId(null)
        setRoomName("")
        setRoomCapacity(30)
        setRoomRecommendedFor("Grupos de 15 a 30 niños")
        setRoomDescription("")
        setRoomImageUrl("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80")
        setRoomIncludesText("Acceso exclusivo al salón por 3 horas\nMesa de dulces decorada\nServicio de garzón dedicado")
    }

    const handleSubmitRoom = async (e: React.FormEvent) => {
        e.preventDefault()

        const includesArray = roomIncludesText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)

        const res = await upsertPartyRoom({
            id: editingRoomId || undefined,
            name: roomName,
            capacity: Number(roomCapacity),
            recommendedFor: roomRecommendedFor,
            description: roomDescription,
            imageUrl: roomImageUrl,
            includes: includesArray,
        } as any)

        if (res.success) {
            alert("¡Datos e imágenes del salón actualizados con éxito!")
            handleResetRoomForm()
            onReload()
        } else {
            alert(res.error || "Error al guardar los datos del salón.")
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* VISTA PREVIA DE TARJETAS CON TODOS LOS DATOS VISIBLES */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="font-extrabold text-slate-900 text-base">Salones de Cumpleaños Registrados</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {partyRooms.map((room) => (
                        <div key={room.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                            <div>
                                {/* FOTO CON BADGE DE CAPACIDAD */}
                                <div className="relative h-44 w-full bg-slate-100">
                                    <img
                                        src={room.imageUrl || "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80"}
                                        alt={room.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20">
                                        👑 Capacidad: {room.capacity} Niños
                                    </span>
                                </div>

                                <div className="p-5 space-y-3">
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{room.name}</h3>
                                        <p className="text-[11px] font-bold text-pokido-purple bg-pokido-purple/10 border border-pokido-purple/20 px-2 py-0.5 rounded-md inline-block mt-1">
                                            {room.recommendedFor || "Grupos generales"}
                                        </p>
                                    </div>

                                    {/* DESCRIPCIÓN COMPLETA VISIBLE */}
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                                            Descripción del Salón:
                                        </span>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                                            {room.description || "Sin descripción configurada."}
                                        </p>
                                    </div>

                                    {/* LISTA COMPLETA DE SERVICIOS E INCLUSIONES */}
                                    {Array.isArray(room.includes) && room.includes.length > 0 && (
                                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                                                Servicios e Inclusiones ({room.includes.length}):
                                            </span>
                                            <ul className="text-[11px] text-slate-700 font-semibold space-y-1">
                                                {room.includes.map((inc, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <span className="text-pokido-green font-black">✓</span>
                                                        <span>{inc}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 pt-0">
                                <button
                                    type="button"
                                    onClick={() => handleEditRoom(room)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>✏️</span> Modificar Datos de este Salón
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FORMULARIO DE EDICIÓN */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                <h2 className="font-extrabold text-slate-900 text-base">
                    {editingRoomId ? "✏️ Modificar Ficha del Salón" : "➕ Agregar Nuevo Salón"}
                </h2>

                <form onSubmit={handleSubmitRoom} className="space-y-3.5 text-xs">
                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">Nombre Comercial del Salón *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Salón Pokido Galaxy"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">Capacidad Máxima (Niños) *</label>
                        <input
                            type="number"
                            required
                            min={1}
                            max={60}
                            value={roomCapacity}
                            onChange={(e) => setRoomCapacity(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">Recomendado Para</label>
                        <input
                            type="text"
                            placeholder="Ej. Grupos de 15 a 30 niños"
                            value={roomRecommendedFor}
                            onChange={(e) => setRoomRecommendedFor(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">URL de la Foto / Imagen</label>
                        <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={roomImageUrl}
                            onChange={(e) => setRoomImageUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px] text-slate-700"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">Descripción Comercial</label>
                        <textarea
                            rows={3}
                            placeholder="Descripción atractiva del salón..."
                            value={roomDescription}
                            onChange={(e) => setRoomDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 resize-none"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">
                            Servicios e Inclusiones (Escribe un ítem por línea)
                        </label>
                        <textarea
                            rows={4}
                            placeholder={"Acceso exclusivo al salón por 3 horas\nMesa de dulces decorada\nServicio de garzón dedicado"}
                            value={roomIncludesText}
                            onChange={(e) => setRoomIncludesText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 resize-none text-[11px]"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingRoomId && (
                            <button
                                type="button"
                                onClick={handleResetRoomForm}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 bg-pokido-purple text-white font-extrabold py-3 rounded-2xl transition shadow-md shadow-pokido-purple/20 cursor-pointer"
                        >
                            {editingRoomId ? "Guardar Cambios" : "Crear Salón"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}