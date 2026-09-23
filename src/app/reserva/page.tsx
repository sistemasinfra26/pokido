"use client"

import { useState, useEffect, useRef } from "react"
import { getPublicSlotAvailability, createOnlineOrder, findCustomerByDni, SlotStatus } from "@/app/actions/webBookingActions"
import { getTicketTypes } from "@/app/actions/ticketTypeActions"
import { createMercadoPagoPreference } from "@/app/actions/checkoutActions"

// 🔑 FUNCIONES AUXILIARES DE VALIDACIÓN DEDICADAS
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
const validateFullName = (name: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)+$/.test(name.trim()) // Al menos Nombre + Apellido
const validatePhone = (phone: string) => phone.replace(/\D/g, "").length >= 8
const validateDni = (dni: string) => dni.trim().length >= 7

export default function WebBookingPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const dateInputRef = useRef<HTMLInputElement>(null)

    // Paso 1: Turno y Fecha
    const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0])
    const [slots, setSlots] = useState<SlotStatus[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Paso 2: Datos del Titular
    const [ticketTypes, setTicketTypes] = useState<any[]>([])
    const [customerDni, setCustomerDni] = useState("")
    const [customerName, setCustomerName] = useState("")
    const [customerAge, setCustomerAge] = useState("20")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [searchingCustomer, setSearchingCustomer] = useState(false)
    const [signedWaiver, setSignedWaiver] = useState(false)

    const [isAdultParticipant, setIsAdultParticipant] = useState(false)
    const [minors, setMinors] = useState<Array<{ fullName: string; age: string; ticketTypeId: string; price: number }>>([])
    const [processing, setLoadingProcessing] = useState(false)
    const [completedOrder, setCompletedOrder] = useState<any>(null)

    // 🔑 ESTADO PARA MANEJO DE ERRORES DE FORMULARIO
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        async function loadInitialData() {
            const tRes = await getTicketTypes()
            const list = tRes.success ? (tRes.ticketTypes || (tRes as any).data || []) : []
            setTicketTypes(list)

            if (list.length > 0) {
                setMinors([{ fullName: "", age: "7", ticketTypeId: list[0].id, price: Number(list[0].price) }])
            }
        }
        loadInitialData()
    }, [])

    useEffect(() => {
        async function fetchAvailability() {
            setLoadingSlots(true)
            const res = await getPublicSlotAvailability(dateStr)
            if (res.success && res.slots) {
                setSlots(res.slots)
            }
            setLoadingSlots(false)
        }
        fetchAvailability()
    }, [dateStr])

    const formatFormattedDate = (isoDate: string) => {
        if (!isoDate) return ""
        const [year, month, day] = isoDate.split("-")
        return `${day}/${month}/${year}`
    }

    const handleOpenCalendar = () => {
        if (dateInputRef.current) {
            try {
                dateInputRef.current.showPicker()
            } catch (error) {
                dateInputRef.current.focus()
            }
        }
    }

    const handleDniBlur = async () => {
        if (!customerDni.trim()) return

        setSearchingCustomer(true)
        const res = await findCustomerByDni(customerDni)
        setSearchingCustomer(false)

        if (res.success && res.customer) {
            setCustomerName(res.customer.fullName || "")
            setCustomerPhone(res.customer.phone || "")
            setCustomerEmail(res.customer.email || "")
        }
    }

    const getFinalParticipants = () => {
        if (isAdultParticipant) {
            const defaultType = ticketTypes[0]
            return [
                {
                    fullName: customerName || "Participante Mayor",
                    age: Number(customerAge) || 18,
                    ticketTypeId: defaultType?.id || "",
                    price: Number(defaultType?.price || 8500),
                },
            ]
        }
        return minors.map((m) => ({
            fullName: m.fullName,
            age: Number(m.age) || 0,
            ticketTypeId: m.ticketTypeId,
            price: m.price,
        }))
    }

    const calculateTotal = () => {
        const participants = getFinalParticipants()
        return participants.reduce((sum, m) => sum + m.price, 0)
    }

    const handleAddMinorRow = () => {
        const defaultType = ticketTypes[0]
        setMinors([
            ...minors,
            {
                fullName: "",
                age: "6",
                ticketTypeId: defaultType?.id || "",
                price: Number(defaultType?.price || 8500),
            },
        ])
    }

    const handleRemoveMinorRow = (idx: number) => {
        if (minors.length === 1) return
        setMinors(minors.filter((_, i) => i !== idx))
    }

    // 🔑 SISTEMA COMPLETO DE VALIDACIÓN
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {}

        if (!validateDni(customerDni)) {
            errors.customerDni = "DNI / RUT inválido (mínimo 7 caracteres)."
        }

        if (!validateFullName(customerName)) {
            errors.customerName = "Ingresa nombre y apellido completo (ej. Carlos Pérez)."
        }

        if (!validatePhone(customerPhone)) {
            errors.customerPhone = "Ingresa un número de teléfono válido (mín. 8 dígitos)."
        }

        if (!validateEmail(customerEmail)) {
            errors.customerEmail = "Ingresa un correo electrónico válido (ejemplo@gmail.com)."
        }

        if (isAdultParticipant) {
            const ageNum = Number(customerAge)
            if (isNaN(ageNum) || ageNum < 18) {
                errors.customerAge = "El titular debe ser mayor de 18 años."
            }
        } else {
            minors.forEach((m, idx) => {
                if (!validateFullName(m.fullName)) {
                    errors[`minorName_${idx}`] = "Ingresa nombre y apellido del niño/a."
                }
                const ageNum = Number(m.age)
                if (isNaN(ageNum) || ageNum < 1 || ageNum > 17) {
                    errors[`minorAge_${idx}`] = "La edad debe estar entre 1 y 17 años."
                }
            })
        }

        if (!signedWaiver) {
            errors.signedWaiver = "Debes aceptar el deslinde de responsabilidad para continuar."
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleConfirmBooking = async () => {
        if (!selectedSlot) return

        // 🔑 EJECUTA LA VALIDACIÓN ANTES DE ENVIAR
        if (!validateForm()) return

        setLoadingProcessing(true)

        const formattedParticipants = getFinalParticipants()

        const res = await createOnlineOrder({
            customerDni,
            customerName,
            customerPhone,
            customerEmail,
            dateStr,
            timeSlot: selectedSlot,
            signedWaiver,
            minors: formattedParticipants,
        })

        if (!res.success || !res.orderId) {
            alert(res.error || "Error al procesar la reserva.")
            setLoadingProcessing(false)
            return
        }

        const mpRes = await createMercadoPagoPreference(res.orderId)

        if (mpRes.success && mpRes.initPoint) {
            window.location.href = mpRes.initPoint
        } else {
            alert(mpRes.error || "No se pudo conectar con Mercado Pago.")
            setLoadingProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* CABECERA BRANDING */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-pokido-cyan">POKIDDO</h1>
                    <p className="text-slate-400 text-sm font-medium">Reserva tu entrada anticipada y evita filas</p>
                </div>

                {/* PASO 1: SELECCIÓN DE TURNO */}
                {step === 1 && (
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                            <span>1.</span> Selecciona Fecha y Turno de Ingreso
                        </h2>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Fecha de Visita</label>

                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-3">
                                <span className="text-sm font-extrabold text-white flex-1 pl-1">
                                    {formatFormattedDate(dateStr)}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleOpenCalendar}
                                    title="Abrir calendario"
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-pokido-cyan rounded-xl transition text-base flex items-center justify-center cursor-pointer border border-slate-700"
                                >
                                    📅
                                </button>

                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={dateStr}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setDateStr(e.target.value)
                                            setSelectedSlot(null)
                                        }
                                    }}
                                    className="sr-only"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">Horario de Turno Disponible</label>
                            {loadingSlots ? (
                                <p className="text-xs text-slate-500 animate-pulse">Consultando cupos en tiempo real...</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {slots.map((item) => {
                                        const isSelected = selectedSlot === item.slot
                                        const isDisabled = item.isPast || item.isFull

                                        return (
                                            <button
                                                key={item.slot}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setSelectedSlot(item.slot)}
                                                className={`p-3 rounded-2xl border transition text-center cursor-pointer ${isSelected
                                                    ? "bg-pokido-cyan text-slate-950 font-black border-pokido-cyan shadow-lg shadow-pokido-cyan/20"
                                                    : isDisabled
                                                        ? "bg-slate-900/40 text-slate-600 border-slate-800/80 cursor-not-allowed"
                                                        : "bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500"
                                                    }`}
                                            >
                                                <div className="text-xs font-bold">{item.slot} hs</div>
                                                <div className="text-[10px] opacity-75 font-medium mt-0.5">
                                                    {item.isPast ? "Finalizado" : item.isFull ? "Agotado" : `${item.available} cupos`}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            disabled={!selectedSlot}
                            onClick={() => setStep(2)}
                            className="w-full bg-pokido-cyan hover:bg-pokido-cyan/90 disabled:opacity-40 text-slate-950 font-black py-4 rounded-2xl transition text-sm cursor-pointer shadow-xl shadow-pokido-cyan/10"
                        >
                            Continuar a Registro de Participantes ➔
                        </button>
                    </div>
                )}

                {/* PASO 2: DATOS DEL TITULAR Y ACOMPAÑANTES */}
                {step === 2 && (
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                                <span>2.</span> Datos del Titular
                            </h2>
                            <button onClick={() => setStep(1)} className="text-xs text-pokido-cyan hover:underline font-bold cursor-pointer">
                                ✎ {formatFormattedDate(dateStr)} - {selectedSlot} hs
                            </button>
                        </div>

                        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700 flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-300">
                                ¿La entrada es para un usuario mayor de 18 años (sin tutor)?
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsAdultParticipant(!isAdultParticipant)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${isAdultParticipant
                                    ? "bg-pokido-cyan text-slate-950 shadow-md"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                    }`}
                            >
                                {isAdultParticipant ? "Sí (Soy Mayor 18+)" : "No (Acompaño a Menores)"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* DNI */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-400 block">DNI / RUT Titular *</label>
                                    {searchingCustomer && <span className="text-[10px] text-pokido-cyan animate-pulse">Buscando...</span>}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ej. 18234567-K"
                                    value={customerDni}
                                    onBlur={handleDniBlur}
                                    onChange={(e) => {
                                        setCustomerDni(e.target.value)
                                        setFormErrors((prev) => ({ ...prev, customerDni: "" }))
                                    }}
                                    className={`w-full bg-slate-900 border rounded-xl p-3 text-xs font-bold text-white focus:outline-none ${formErrors.customerDni ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                />
                                {formErrors.customerDni && <span className="text-[10px] text-rose-400 font-bold mt-1 block">{formErrors.customerDni}</span>}
                            </div>

                            {/* NOMBRE */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Nombre y Apellido *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Carlos Pérez"
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value)
                                        setFormErrors((prev) => ({ ...prev, customerName: "" }))
                                    }}
                                    className={`w-full bg-slate-900 border rounded-xl p-3 text-xs font-medium text-white focus:outline-none ${formErrors.customerName ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                />
                                {formErrors.customerName && <span className="text-[10px] text-rose-400 font-bold mt-1 block">{formErrors.customerName}</span>}
                            </div>

                            {/* EDAD ADULTO */}
                            {isAdultParticipant && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-1 block">Edad del Titular *</label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="99"
                                        placeholder="Ej. 20"
                                        value={customerAge}
                                        onChange={(e) => {
                                            setCustomerAge(e.target.value)
                                            setFormErrors((prev) => ({ ...prev, customerAge: "" }))
                                        }}
                                        className={`w-full bg-slate-900 border rounded-xl p-3 text-xs font-bold text-white focus:outline-none ${formErrors.customerAge ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                    />
                                    {formErrors.customerAge && <span className="text-[10px] text-rose-400 font-bold mt-1 block">{formErrors.customerAge}</span>}
                                </div>
                            )}

                            {/* TELÉFONO */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Teléfono Móvil *</label>
                                <input
                                    type="text"
                                    placeholder="+56 9 1234 5678"
                                    value={customerPhone}
                                    onChange={(e) => {
                                        setCustomerPhone(e.target.value)
                                        setFormErrors((prev) => ({ ...prev, customerPhone: "" }))
                                    }}
                                    className={`w-full bg-slate-900 border rounded-xl p-3 text-xs font-medium text-white focus:outline-none ${formErrors.customerPhone ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                />
                                {formErrors.customerPhone && <span className="text-[10px] text-rose-400 font-bold mt-1 block">{formErrors.customerPhone}</span>}
                            </div>

                            {/* EMAIL */}
                            <div className={isAdultParticipant ? "sm:col-span-2" : ""}>
                                <label className="text-xs font-bold text-slate-400 mb-1 block">Email (Recibirás tu QR) *</label>
                                <input
                                    type="email"
                                    placeholder="carlos@gmail.com"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value)
                                        setFormErrors((prev) => ({ ...prev, customerEmail: "" }))
                                    }}
                                    className={`w-full bg-slate-900 border rounded-xl p-3 text-xs font-medium text-white focus:outline-none ${formErrors.customerEmail ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                />
                                {formErrors.customerEmail && <span className="text-[10px] text-rose-400 font-bold mt-1 block">{formErrors.customerEmail}</span>}
                            </div>
                        </div>

                        {/* LISTADO DE NIÑOS */}
                        {!isAdultParticipant && (
                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                        Entradas / Niños ({minors.length})
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddMinorRow}
                                        className="text-xs font-bold text-pokido-cyan hover:underline cursor-pointer"
                                    >
                                        + Agregar Entrada
                                    </button>
                                </div>

                                {minors.map((m, idx) => (
                                    <div key={idx} className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-3">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                            <span>Niño #{idx + 1}</span>
                                            {minors.length > 1 && (
                                                <button onClick={() => handleRemoveMinorRow(idx)} className="text-pokido-red hover:underline cursor-pointer font-bold">
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Nombre y Apellido del Niño/a *</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Mateo Pérez"
                                                    value={m.fullName}
                                                    onChange={(e) => {
                                                        const updated = [...minors]
                                                        updated[idx].fullName = e.target.value
                                                        setMinors(updated)
                                                        setFormErrors((prev) => ({ ...prev, [`minorName_${idx}`]: "" }))
                                                    }}
                                                    className={`w-full bg-slate-800 border rounded-xl p-2.5 text-xs text-white focus:outline-none ${formErrors[`minorName_${idx}`] ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                                />
                                                {formErrors[`minorName_${idx}`] && <span className="text-[10px] text-rose-400 font-bold mt-0.5 block">{formErrors[`minorName_${idx}`]}</span>}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Edad *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="17"
                                                    placeholder="Ej. 7"
                                                    value={m.age}
                                                    onChange={(e) => {
                                                        const updated = [...minors]
                                                        updated[idx].age = e.target.value
                                                        setMinors(updated)
                                                        setFormErrors((prev) => ({ ...prev, [`minorAge_${idx}`]: "" }))
                                                    }}
                                                    className={`w-full bg-slate-800 border rounded-xl p-2.5 text-xs text-white font-bold text-center focus:outline-none ${formErrors[`minorAge_${idx}`] ? "border-rose-500" : "border-slate-700 focus:ring-2 focus:ring-pokido-cyan"}`}
                                                />
                                                {formErrors[`minorAge_${idx}`] && <span className="text-[10px] text-rose-400 font-bold mt-0.5 block">{formErrors[`minorAge_${idx}`]}</span>}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tipo de Entrada *</label>
                                                <select
                                                    value={m.ticketTypeId}
                                                    onChange={(e) => {
                                                        const selectedType = ticketTypes.find((t) => t.id === e.target.value)
                                                        const updated = [...minors]
                                                        updated[idx].ticketTypeId = e.target.value
                                                        updated[idx].price = Number(selectedType?.price || 0)
                                                        setMinors(updated)
                                                    }}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-pokido-cyan"
                                                >
                                                    {ticketTypes.map((type) => (
                                                        <option key={type.id} value={type.id}>
                                                            {type.name} (${Number(type.price).toLocaleString("es-CL")})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* WAIVER */}
                        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 space-y-2">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={signedWaiver}
                                    onChange={(e) => {
                                        setSignedWaiver(e.target.checked)
                                        setFormErrors((prev) => ({ ...prev, signedWaiver: "" }))
                                    }}
                                    className="mt-1 w-4 h-4 rounded text-pokido-cyan focus:ring-pokido-cyan cursor-pointer"
                                />
                                <span className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Acepto el <strong className="text-white">Reglamento de Seguridad y Deslinde de Responsabilidad</strong> de POKIDOPARK para mí o los menores a mi cargo.
                                </span>
                            </label>
                            {formErrors.signedWaiver && <span className="text-[10px] text-rose-400 font-bold block">{formErrors.signedWaiver}</span>}
                        </div>

                        {/* RESUMEN Y PAGO */}
                        <div className="bg-slate-900 p-4 rounded-2xl flex justify-between items-center border border-slate-700">
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">Total a Pagar:</span>
                                <span className="text-2xl font-black text-pokido-green">${calculateTotal().toLocaleString("es-CL")}</span>
                            </div>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={handleConfirmBooking}
                                className="bg-pokido-green hover:bg-pokido-green/90 disabled:opacity-40 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition text-xs shadow-lg shadow-pokido-green/10 cursor-pointer"
                            >
                                {processing ? "Redirigiendo a Mercado Pago..." : "💳 Pagar con Mercado Pago"}
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 3: CONFIRMACIÓN POST PAGO */}
                {step === 3 && completedOrder && (
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center space-y-6 animate-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-pokido-green/20 text-pokido-green rounded-full flex items-center justify-center text-3xl mx-auto border border-pokido-green/30">
                            ✓
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">¡Reserva Confirmada!</h2>
                            <p className="text-xs text-slate-400">
                                Orden <strong>{completedOrder.orderNumber}</strong> | Titular: <strong>{completedOrder.customerName}</strong>
                            </p>
                        </div>

                        <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl">
                            <div className="w-44 h-44 bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-bold text-center text-xs p-2 rounded-xl">
                                <span>📱 SCAN EN RECEPCIÓN</span>
                                <span className="text-[10px] text-pokido-cyan mt-2">{completedOrder.orderNumber}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 max-w-sm mx-auto font-medium leading-relaxed">
                            Muestra este código en la caja al llegar a PokidoPark el día <strong>{formatFormattedDate(dateStr)}</strong> a las <strong>{selectedSlot} hs</strong> para recibir tus pulseras físicas.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}