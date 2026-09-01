"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PaymentMethod } from "@prisma/client"
import { PosHeader } from "./components/PosHeader"
import { CustomerStep } from "./components/CustomerStep"
import { MinorTicketStep } from "./components/MinorTicketStep"
import { CartAndCheckoutSummary, CartItem } from "./components/CartAndCheckoutSummary"
import { TimeSlotScheduler } from "../components/TimeSlotScheduler"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

function PosContent() {
    const searchParams = useSearchParams()

    const timeParam = searchParams.get("time")
    const durationParam = searchParams.get("duration")

    const [dniQuery, setDniQuery] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; dni: string; hasWaiver: boolean } | null>(null)
    const [selectedMinors, setSelectedMinors] = useState<CartItem[]>([])

    const [minorName, setMinorName] = useState("")
    const [minorAge, setMinorAge] = useState("")
    const [ticketType, setTicketType] = useState("Pase 60 Minutos ($8.500)")
    const [ticketPrice, setTicketPrice] = useState(8500)
    const [wristbandCode, setWristbandCode] = useState("")

    // Estados para Horario y Color de Pulsera
    const [entryTime, setEntryTime] = useState<string>("16:00")
    const [selectedColorId, setSelectedColorId] = useState<number>(1)

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)

    // Estado para Ocupación del Parque
    const [occupancyData, setOccupancyData] = useState<Record<string, number>>({})

    // Función para obtener los datos de ocupación desde el servidor
    const loadOccupancy = async () => {
        const res = await getDashboardData()
        if (res.success && res.data?.occupancyData) {
            setOccupancyData(res.data.occupancyData)
        }
    }

    // Cargar la ocupación al montar el componente
    useEffect(() => {
        loadOccupancy()
    }, [])

    // Helper para formatear nombre y precio de pase según la duración
    const setTicketPropsByDuration = (dur: number) => {
        if (dur === 120) {
            setTicketType("Pase 120 Minutos ($14.000)")
            setTicketPrice(14000)
        } else if (dur === 90) {
            setTicketType("Pase 90 Minutos ($11.500)")
            setTicketPrice(11500)
        } else if (dur === 30) {
            setTicketType("Pase 30 Minutos ($5.000)")
            setTicketPrice(5000)
        } else {
            setTicketType("Pase 60 Minutos ($8.500)")
            setTicketPrice(8500)
        }
    }

    // Inicializar hora actual por defecto si no viene de la URL
    useEffect(() => {
        if (!timeParam) {
            const nowStr = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
            setEntryTime(nowStr)
        }
    }, [timeParam])

    // Capturar hora Y duración directamente desde la URL cuando redirige desde el Scheduler/Dashboard
    useEffect(() => {
        if (timeParam) setEntryTime(timeParam)

        if (durationParam) {
            const dur = Number(durationParam)
            setTicketPropsByDuration(dur)
        }
    }, [timeParam, durationParam])

    // Handler sincronizado al hacer clic en cualquier celda de tiempo/duración dentro del Scheduler
    const handleSelectSlotFromScheduler = (timeStr: string, duration: number, colorId: number) => {
        setEntryTime(timeStr)
        setSelectedColorId(colorId)
        setTicketPropsByDuration(duration) // <-- Sincroniza la duración y precio elegidos
    }

    const handleAddMinorToCart = () => {
        if (!minorName || !wristbandCode) return

        // Extraer la duración dinámica de la cadena de texto del pase seleccionado
        let duration = 60
        if (ticketType.includes("120")) duration = 120
        else if (ticketType.includes("90")) duration = 90
        else if (ticketType.includes("30")) duration = 30
        else {
            const match = ticketType.match(/(\d+)\s*Min/)
            if (match) duration = Number(match[1])
        }

        const newItem: CartItem = {
            minorName: minorName,
            minorAge: Number(minorAge) || 0,
            ticketTypeId: `TICKET-${duration}`,
            durationMinutes: duration,
            price: ticketPrice,
            wristbandCode: wristbandCode.toUpperCase(),
            entryTime: entryTime || "16:00",
        }

        setSelectedMinors([...selectedMinors, newItem])
        setMinorName("")
        setMinorAge("")
        setWristbandCode("")
    }

    const handleSuccessSale = async () => {
        setSelectedMinors([])
        setSelectedCustomer(null)
        setDniQuery("")
        // Refrescar ocupación tras una venta exitosa
        await loadOccupancy()
    }

    const totalAmount = selectedMinors.reduce((acc, curr) => acc + curr.price, 0)

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <PosHeader />

                {/* Banner dinámico de Turno Activo */}
                {entryTime && (
                    <div className="p-4 bg-pokido-purple/10 border border-pokido-purple/20 rounded-2xl flex items-center justify-between shadow-sm">
                        <span className="text-xs font-bold text-pokido-purple flex items-center gap-2">
                            <span>🕒</span>
                            <span>
                                Turno Seleccionado: <strong className="text-slate-900 font-extrabold">{entryTime} hs</strong> ({ticketType})
                            </span>
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                window.history.replaceState(null, "", "/dashboard/pos")
                                const nowStr = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
                                setEntryTime(nowStr)
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-xl transition cursor-pointer"
                        >
                            ✕ Cambiar a Hora Actual
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* PASO 1: CLIENTE */}
                        <CustomerStep
                            dniQuery={dniQuery}
                            setDniQuery={setDniQuery}
                            selectedCustomer={selectedCustomer}
                            setSelectedCustomer={setSelectedCustomer}
                        />

                        {/* PASO 2: TICKET, HORARIO Y COLOR */}
                        <MinorTicketStep
                            minorName={minorName}
                            setMinorName={setMinorName}
                            minorAge={minorAge}
                            setMinorAge={setMinorAge}
                            ticketType={ticketType}
                            setTicketType={setTicketType}
                            setTicketPrice={setTicketPrice}
                            wristbandCode={wristbandCode}
                            setWristbandCode={setWristbandCode}
                            entryTime={entryTime}
                            setEntryTime={setEntryTime}
                            selectedColorId={selectedColorId}
                            setSelectedColorId={setSelectedColorId}
                            onAddMinorToCart={handleAddMinorToCart}
                        />

                        {/* TABLA DE ROTACIÓN CON OCUPACIÓN REAL */}
                        <TimeSlotScheduler
                            isInteractive={true}
                            capacityPerSlot={PARK_TOTAL_MAX_CAPACITY}
                            occupancyData={occupancyData}
                            onSelectSlot={handleSelectSlotFromScheduler}
                        />
                    </div>

                    {/* RESUMEN Y CHECKOUT */}
                    <CartAndCheckoutSummary
                        selectedCustomer={selectedCustomer}
                        selectedMinors={selectedMinors}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        totalAmount={totalAmount}
                        onSuccessSale={handleSuccessSale}
                    />
                </div>
            </div>
        </div>
    )
}

export default function PosPage() {
    return (
        <Suspense fallback={
            <div className="p-6 bg-slate-100 min-h-screen flex items-center justify-center font-bold text-slate-400">
                Cargando Punto de Venta...
            </div>
        }>
            <PosContent />
        </Suspense>
    )
}