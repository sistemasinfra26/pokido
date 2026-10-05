"use client"

import { useState, useEffect } from "react"
import { createOnlinePartyBooking } from "@/app/actions/partyActions"
import { getPartyDepositPercentage } from "@/app/actions/systemSettingsActions"

interface PublicPartyBookingModalProps {
    room: any
    onClose: () => void
}

export function PublicPartyBookingModal({ room, onClose }: PublicPartyBookingModalProps) {
    const [loading, setLoading] = useState(false)
    const [depositPercentage, setDepositPercentage] = useState<number>(30)

    // Cargar porcentaje configurado en BD al abrir el modal
    useEffect(() => {
        getPartyDepositPercentage().then((pct) => setDepositPercentage(pct))
    }, [])

    // Datos del Tutor
    const [customerDni, setCustomerDni] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")

    // Detalles del Evento
    const [birthdayChild, setBirthdayChild] = useState("")
    const [childAge, setChildAge] = useState(7)
    const [guestCount, setGuestCount] = useState(10)
    const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0])
    const [startTimeStr, setStartTimeStr] = useState("17:00")
    const [endTimeStr, setEndTimeStr] = useState("20:00")

    // 🔑 Cálculos Comerciales Dinámicos
    const basePrice = room?.basePrice ? Number(room.basePrice) : 35000
    const minGuests = room?.minGuests || 10
    const extraPricePerGuest = room?.extraGuestPrice ? Number(room.extraGuestPrice) : 3000

    const extraGuests = Math.max(0, guestCount - minGuests)
    const fullRoomPrice = basePrice + (extraGuests * extraPricePerGuest)
    const depositPrice = Math.round(fullRoomPrice * (depositPercentage / 100))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!dateStr || !birthdayChild || !customerDni || !customerName || !customerPhone) {
            alert("Por favor completa todos los campos obligatorios.")
            return
        }

        setLoading(true)

        const res = await createOnlinePartyBooking({
            roomId: room.id,
            customerDni,
            customerName,
            customerPhone,
            customerEmail,
            birthdayChild,
            childAge: Number(childAge),
            guestCount: Number(guestCount),
            dateStr,
            startTimeStr,
            endTimeStr,
            totalPrice: depositPrice,
        })

        if (res.success && res.initPoint) {
            window.location.href = res.initPoint
        } else {
            alert(res.error || "Ocurrió un error al procesar la reserva.")
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 my-8"
            >
                {/* CABECERA */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                            <span>🎉</span> Reservar {room.name || "Salón de Cumpleaños"}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            Seña ({depositPercentage}%): <strong className="text-slate-700">${depositPrice.toLocaleString()} ARS</strong> (Total:${fullRoomPrice.toLocaleString()} ARS)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-black text-xs flex items-center justify-center transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* TUTOR */}
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

                        <div>
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

                        <div>
                            <label className="font-bold text-slate-600 mb-1 block">Correo Electrónico *</label>
                            <input
                                type="email"
                                required
                                placeholder="tutor@email.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                            />
                        </div>
                    </div>
                </div>

                {/* BANNER DINÁMICO */}
                <div className="p-3.5 bg-purple-50 border border-purple-200/80 rounded-2xl text-[11px] font-bold text-purple-900 flex items-start justify-between gap-2">
                    <div>
                        <span>Valor Total Evento: <strong>${fullRoomPrice.toLocaleString()} ARS</strong> ({guestCount} niños)</span>
                        <p className="text-[10px] text-purple-700 font-medium leading-tight mt-0.5">
                            Abonas ahora la seña del {depositPercentage}% (${depositPrice.toLocaleString()} ARS) por Mercado Pago y cancelas el saldo restante (${(fullRoomPrice - depositPrice).toLocaleString()} ARS) el día del evento en recepción.
                        </p>
                    </div>
                </div>

                {/* DETALLES EVENTO */}
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
                            <label className="font-bold text-slate-600 mb-1 block">Invitados (Niños) *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={room?.capacity || 35}
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

                {/* BOTONES */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl text-xs font-extrabold bg-pokido-purple hover:bg-pokido-purple/90 text-white transition shadow-lg shadow-pokido-purple/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? "Procesando..." : `Pagar Seña ($${depositPrice.toLocaleString()} ARS) ➔`}
                    </button>
                </div>
            </form>
        </div>
    )
}