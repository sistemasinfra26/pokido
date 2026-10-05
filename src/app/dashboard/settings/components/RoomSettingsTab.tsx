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
    const [basePrice, setBasePrice] = useState<number>(35000)
    const [minGuests, setMinGuests] = useState<number>(10)
    const [extraGuestPrice, setExtraGuestPrice] = useState<number>(3000)
    const [roomCapacity, setRoomCapacity] = useState(30)
    const [roomRecommendedFor, setRoomRecommendedFor] = useState("Grupos de 15 a 30 niños")
    const [roomDescription, setRoomDescription] = useState("")
    const [roomImageUrl, setRoomImageUrl] = useState("https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80")
    const [roomIncludesText, setRoomIncludesText] = useState("Acceso exclusivo al salón por 3 horas\nMesa de dulces decorada\nServicio de garzón dedicado")

    const handleEditRoom = (room: any) => {
        setEditingRoomId(room.id)
        setRoomName(room.name)
        setBasePrice(room.basePrice ? Number(room.basePrice) : 35000)
        setMinGuests(room.minGuests || 10)
        setExtraGuestPrice(room.extraGuestPrice ? Number(room.extraGuestPrice) : 3000)
        setRoomCapacity(room.capacity || 30)
        setRoomRecommendedFor(room.recommendedFor || "Grupos generales")
        setRoomDescription(room.description || "")
        setRoomImageUrl(room.imageUrl || "")
        setRoomIncludesText(Array.isArray(room.includes) ? room.includes.join("\n") : "")
    }

    const handleResetRoomForm = () => {
        setEditingRoomId(null)
        setRoomName("")
        setBasePrice(35000)
        setMinGuests(10)
        setExtraGuestPrice(3000)
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
            basePrice: Number(basePrice),
            minGuests: Number(minGuests),
            extraGuestPrice: Number(extraGuestPrice),
            recommendedFor: roomRecommendedFor,
            description: roomDescription,
            imageUrl: roomImageUrl,
            includes: includesArray,
        })

        if (res.success) {
            alert("¡Ficha del salón guardada exitosamente!")
            handleResetRoomForm()
            onReload()
        } else {
            alert(res.error || "Error al guardar los datos del salón.")
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* VISTA PREVIA DE TARJETAS */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="font-extrabold text-slate-900 text-base">Salones de Cumpleaños Registrados</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {partyRooms.map((room: any) => (
                        <div key={room.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                            <div>
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
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 text-base leading-snug">{room.name}</h3>
                                            <p className="text-[11px] font-bold text-pokido-purple bg-pokido-purple/10 border border-pokido-purple/20 px-2 py-0.5 rounded-md inline-block mt-1">
                                                {room.recommendedFor || "Grupos generales"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Base ({room.minGuests || 10} niños)</span>
                                            <span className="text-sm font-black text-slate-900">${Number(room.basePrice || 35000).toLocaleString()} ARS</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                            <span>Niño extra:</span>
                                            <span className="text-pokido-purple">+${Number(room.extraGuestPrice || 3000).toLocaleString()} ARS</span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line pt-1 border-t border-slate-200/60">
                                            {room.description || "Sin descripción configurada."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 pt-0">
                                <button
                                    type="button"
                                    onClick={() => handleEditRoom(room)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>✏️</span> Modificar Datos
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
                        <label className="font-bold text-slate-600 mb-1 block">Nombre Comercial *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Salón Pokido Galaxy"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-slate-600 mb-1 block">Precio Base ($ ARS) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={basePrice}
                                onChange={(e) => setBasePrice(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-600 mb-1 block">Niños Incluidos Base *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={minGuests}
                                onChange={(e) => setMinGuests(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-slate-600 mb-1 block">Valor Niño Extra ($) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={extraGuestPrice}
                                onChange={(e) => setExtraGuestPrice(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-pokido-purple"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-slate-600 mb-1 block">Capacidad Máx. *</label>
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
                        <label className="font-bold text-slate-600 mb-1 block">URL de la Imagen</label>
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
                            placeholder="Descripción del salón..."
                            value={roomDescription}
                            onChange={(e) => setRoomDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 resize-none"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-600 mb-1 block">Servicios e Inclusiones (1 por línea)</label>
                        <textarea
                            rows={4}
                            placeholder={"Acceso exclusivo por 3 horas\nMesa de dulces decorada"}
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