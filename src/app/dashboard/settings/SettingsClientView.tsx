"use client"

import { useEffect, useState } from "react"
import { getTicketTypes } from "@/app/actions/ticketTypeActions"
import { getAllPartyRooms } from "@/app/actions/partyActions"
import { getPartyDepositPercentage } from "@/app/actions/systemSettingsActions" // 🔑 Importado desde systemSettingsActions
import { TicketType, PartyRoom } from "./types"
import { TicketSettingsTab } from "./components/TicketSettingsTab"
import { RoomSettingsTab } from "./components/RoomSettingsTab"
import { PartyDepositSettingsCard } from "./components/PorcentsSettings"

export default function SettingsClientView() {
    const [activeTab, setActiveTab] = useState<"tickets" | "rooms" | "deposit">("rooms")
    const [loading, setLoading] = useState(true)
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
    const [partyRooms, setPartyRooms] = useState<PartyRoom[]>([])
    const [depositPercentage, setDepositPercentage] = useState<number>(30)

    const loadData = async () => {
        setLoading(true)
        const [resTickets, resRooms, currentPercentage] = await Promise.all([
            getTicketTypes(),
            getAllPartyRooms(),
            getPartyDepositPercentage(),
        ])
        setLoading(false)

        if (resTickets.success && resTickets.ticketTypes) {
            setTicketTypes(
                resTickets.ticketTypes.map((t: any) => ({
                    ...t,
                    price: Number(t.price),
                }))
            )
        }

        if (resRooms.success && resRooms.rooms) {
            setPartyRooms(resRooms.rooms as any)
        }

        if (typeof currentPercentage === "number") {
            setDepositPercentage(currentPercentage)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="p-8 bg-slate-100 min-h-screen flex items-center justify-center font-bold text-slate-500">
                Cargando Centro de Configuración...
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>⚙️</span> Configuración General de Pokido Park
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Personaliza costos de entradas, duraciones, señas comerciales y salones de eventos.
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab("tickets")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === "tickets"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        ⏱️ Pases y Tarifas
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("rooms")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === "rooms"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        🎪 Salones de Cumpleaños
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("deposit")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTab === "deposit"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        💰 Señas y Reservas
                    </button>
                </div>
            </div>

            {activeTab === "tickets" && (
                <TicketSettingsTab ticketTypes={ticketTypes} onReload={loadData} />
            )}

            {activeTab === "rooms" && (
                <RoomSettingsTab partyRooms={partyRooms} onReload={loadData} />
            )}

            {activeTab === "deposit" && (
                <div className="max-w-xl">
                    <PartyDepositSettingsCard initialPercentage={depositPercentage} onReload={loadData} />
                </div>
            )}
        </div>
    )
}