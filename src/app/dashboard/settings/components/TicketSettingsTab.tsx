"use client"

import { useState } from "react"
import { upsertTicketType, deleteTicketType } from "@/app/actions/ticketTypeActions"
import { TicketType } from "../types"

interface TicketSettingsTabProps {
    ticketTypes: TicketType[]
    onReload: () => void
}

export function TicketSettingsTab({ ticketTypes, onReload }: TicketSettingsTabProps) {
    const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
    const [ticketName, setTicketName] = useState("")
    const [durationMinutes, setDurationMinutes] = useState(60)
    const [ticketPrice, setTicketPrice] = useState(8500)

    const handleEditTicket = (item: TicketType) => {
        setEditingTicketId(item.id)
        setTicketName(item.name)
        setDurationMinutes(item.durationMinutes)
        setTicketPrice(item.price)
    }

    const handleResetTicketForm = () => {
        setEditingTicketId(null)
        setTicketName("")
        setDurationMinutes(60)
        setTicketPrice(8500)
    }

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await upsertTicketType({
            id: editingTicketId || undefined,
            name: ticketName || `Pase ${durationMinutes} Minutos`,
            durationMinutes: Number(durationMinutes),
            price: Number(ticketPrice),
        })

        if (res.success) {
            alert("¡Tarifa actualizada exitosamente!")
            handleResetTicketForm()
            onReload()
        } else {
            alert(res.error || "Error al actualizar la tarifa.")
        }
    }

    const handleDeleteTicket = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la tarifa "${name}"?`)) {
            return
        }

        const res = await deleteTicketType(id)
        if (res.success) {
            alert("Tarifa eliminada con éxito.")
            if (editingTicketId === id) {
                handleResetTicketForm()
            }
            onReload()
        } else {
            alert(res.error || "No se pudo eliminar la tarifa.")
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="font-extrabold text-slate-900 text-base">Pases y Precios Configurados</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 uppercase font-black text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Nombre del Pase</th>
                                <th className="py-3 px-4">Duración</th>
                                <th className="py-3 px-4">Precio Actual</th>
                                <th className="py-3 px-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {ticketTypes.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                                    <td className="py-3.5 px-4">
                                        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                                            ⏱️ {item.durationMinutes} min
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 font-black text-pokido-purple text-sm">
                                        ${Number(item.price).toLocaleString("es-CL")}
                                    </td>
                                    <td className="py-3.5 px-4 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEditTicket(item)}
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                                        >
                                            ✏️ Editar
                                        </button>

                                        {/* 🔑 BOTÓN DE ELIMINAR TARIFA */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTicket(item.id, item.name)}
                                            className="bg-red-50 hover:bg-red-100 text-pokido-red border border-red-200 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                                            title="Eliminar tarifa"
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
                <h2 className="font-extrabold text-slate-900 text-base">
                    {editingTicketId ? "✏️ Modificar Pase" : "➕ Crear Nuevo Pase"}
                </h2>

                <form onSubmit={handleSubmitTicket} className="space-y-4 text-xs">
                    <div>
                        <label className="font-bold text-slate-500 mb-1 block">Nombre Comercial del Pase *</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Pase 60 Minutos"
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-500 mb-1 block">Duración (Minutos) *</label>
                        <input
                            type="number"
                            required
                            min={15}
                            step={15}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-slate-500 mb-1 block">Precio / Costo ($) *</label>
                        <input
                            type="number"
                            required
                            min={0}
                            value={ticketPrice}
                            onChange={(e) => setTicketPrice(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-pokido-purple text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingTicketId && (
                            <button
                                type="button"
                                onClick={handleResetTicketForm}
                                className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 bg-pokido-purple text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-md shadow-pokido-purple/20"
                        >
                            {editingTicketId ? "Guardar Cambios" : "Crear Pase"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}