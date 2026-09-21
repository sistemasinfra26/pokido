"use client"

import { useEffect, useState } from "react"
import { getPartyRoomsData, createPartyBooking } from "@/app/actions/partyActions"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { PartyRoomsGrid, RoomWithBookings } from "./components/PartyRoomsGrid"
import { PartyRoomShowcase } from "./components/PartyRoomShowCase"
import { PartiesCalendar } from "./components/PartiesCalendar"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export default function PartiesPage() {
    const [rooms, setRooms] = useState<RoomWithBookings[]>([])
    const [activeInPark, setActiveInPark] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"grid" | "calendar" | "showcase">("grid")

    // Formulario
    const [customerDni, setCustomerDni] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [birthdayChild, setBirthdayChild] = useState("")
    const [childAge, setChildAge] = useState(7)
    const [guestCount, setGuestCount] = useState(30)
    const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0])
    const [startTimeStr, setStartTimeStr] = useState("17:00")
    const [endTimeStr, setEndTimeStr] = useState("20:00")

    const loadData = async () => {
        setLoading(true)

        const [partyRes, dashRes] = await Promise.all([
            getPartyRoomsData(),
            getDashboardData(),
        ])

        setLoading(false)

        if (partyRes.success && partyRes.rooms) {
            setRooms(partyRes.rooms as any)
        }

        if (dashRes.success && dashRes.data) {
            const realActive =
                dashRes.data.kpis?.aforoActual ??
                dashRes.data.activeChildren?.length ??
                0
            setActiveInPark(Number(realActive))
        } else if (partyRes.success && typeof partyRes.activeChildrenInPark === "number") {
            setActiveInPark(partyRes.activeChildrenInPark)
        }
    }

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 60000)
        return () => clearInterval(interval)
    }, [])

    const totalReservedToday = rooms.reduce((acc, room) => {
        return acc + room.bookings.reduce((bAcc, b) => bAcc + b.guestCount, 0)
    }, 0)

    const availableGeneralCapacity = Math.max(
        0,
        PARK_TOTAL_MAX_CAPACITY - totalReservedToday - activeInPark
    )

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoomId) return

        const res = await createPartyBooking({
            roomId: selectedRoomId,
            customerDni,
            customerName,
            customerPhone,
            birthdayChild,
            childAge,
            guestCount,
            dateStr,
            startTimeStr,
            endTimeStr,
        })

        if (res.success) {
            alert("¡Reserva de cumpleaños creada con éxito!")
            setSelectedRoomId(null)
            loadData()
        } else {
            alert(res.error || "No se pudo agendar la reserva.")
        }
    }

    if (loading) {
        return (
            <div className="p-8 bg-slate-100 min-h-screen flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-pokido-purple border-t-transparent rounded-full animate-spin" />
                <span className="font-extrabold text-xs text-slate-500 tracking-wide uppercase">
                    Cargando Salones y Aforo en Tiempo Real...
                </span>
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 bg-pokido-purple/10 text-pokido-purple px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-pokido-purple/20">
                        <span>🎉</span> Gestión de Eventos y Reservas
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Salones de Cumpleaños & Control de Aforo
                    </h1>
                    <p className="text-xs text-slate-400 max-w-xl font-medium">
                        Administra los eventos reservados y consulta en tiempo real cómo impactan los cupos de los cumpleaños en la capacidad tope del parque.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-center min-w-[110px]">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Tope Parque</span>
                        <strong className="text-lg font-black text-slate-900">{PARK_TOTAL_MAX_CAPACITY}</strong>
                    </div>

                    <div className="bg-blue-50/80 border border-blue-200/80 px-4 py-3 rounded-2xl text-center min-w-[110px]">
                        <span className="text-[10px] font-extrabold uppercase text-blue-500 block tracking-wider">En Pista Ahora</span>
                        <strong className="text-lg font-black text-blue-700">{activeInPark}</strong>
                    </div>

                    <div className="bg-purple-50/80 border border-purple-200/80 px-4 py-3 rounded-2xl text-center min-w-[110px]">
                        <span className="text-[10px] font-extrabold uppercase text-purple-500 block tracking-wider">Retenido Cumple</span>
                        <strong className="text-lg font-black text-purple-700">{totalReservedToday}</strong>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-3 rounded-2xl text-center min-w-[120px]">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 block tracking-wider">Libre General</span>
                        <strong className="text-lg font-black text-emerald-700">{availableGeneralCapacity} Cupos</strong>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab("grid")}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${activeTab === "grid"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                >
                    <span>📅</span> Ocupación y Reservas del Día
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("calendar")}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${activeTab === "calendar"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                >
                    <span>🗓️</span> Cronograma Mensual
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("showcase")}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${activeTab === "showcase"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                >
                    <span>🎪</span> Catálogo de Salones
                </button>
            </div>

            {activeTab === "grid" && (
                <PartyRoomsGrid
                    rooms={rooms}
                    onOpenBookingModal={(roomId) => setSelectedRoomId(roomId)}
                />
            )}

            {activeTab === "calendar" && <PartiesCalendar />}

            {activeTab === "showcase" && (
                <PartyRoomShowcase
                    roomsInfo={rooms as any}
                    onSelectRoomToBook={(roomId) => setSelectedRoomId(roomId)}
                />
            )}

            {selectedRoomId && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleCreateBooking}
                        className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200"
                    >
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                    <span>🎉</span> Agendar Reserva de Cumpleaños
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">
                                    Completa los datos del tutor y la reserva del evento.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRoomId(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-black text-xs flex items-center justify-center transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                                1. Datos del Responsable / Tutor
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">DNI / RUT Tutor *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. 38678904"
                                        value={customerDni}
                                        onChange={(e) => setCustomerDni(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. María López"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="font-bold text-slate-600 mb-1 block">Teléfono / WhatsApp *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. +56 9 1234 5678"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                                2. Detalles del Evento
                            </span>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Nombre Festejado/a *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Mateo"
                                        value={birthdayChild}
                                        onChange={(e) => setBirthdayChild(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Edad a Cumplir</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        max={18}
                                        value={childAge}
                                        onChange={(e) => setChildAge(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Cupos a Retener (Niños) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        max={35}
                                        value={guestCount}
                                        onChange={(e) => setGuestCount(Number(e.target.value))}
                                        className="w-full bg-purple-50 border border-purple-200 rounded-xl p-3 font-black text-pokido-purple text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Fecha de Evento *</label>
                                    <input
                                        type="date"
                                        required
                                        value={dateStr}
                                        onChange={(e) => setDateStr(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Hora Inicio *</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTimeStr}
                                        onChange={(e) => setStartTimeStr(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold text-slate-600 mb-1 block">Hora Fin *</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTimeStr}
                                        onChange={(e) => setEndTimeStr(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] font-bold text-amber-800 flex items-start gap-2">
                            <span className="text-sm">⚠️</span>
                            <p className="leading-snug">
                                Se retendrán <strong>{guestCount} cupos</strong> del aforo general el día <strong>{dateStr}</strong> entre las <strong>{startTimeStr} hs</strong> y las <strong>{endTimeStr} hs</strong>.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedRoomId(null)}
                                className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-2xl text-xs font-extrabold bg-pokido-purple hover:bg-pokido-purple/90 text-white transition shadow-lg shadow-pokido-purple/20 cursor-pointer"
                            >
                                Guardar Reserva
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}