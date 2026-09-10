"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PaymentMethod } from "@prisma/client"
import { PosHeader } from "./components/PosHeader"
import { CustomerStep } from "./components/CustomerStep"
import { MinorFormEntry, MinorTicketStep } from "./components/MinorTicketStep"
import { CartAndCheckoutSummary, CartItem } from "./components/CartAndCheckoutSummary"
import { TimeSlotScheduler } from "../components/TimeSlotScheduler"
import { WristbandAssignmentModal, PendingWristbandItem } from "./components/WristBandAssignmentModal"
import { ReceiptModal, SaleReceiptData } from "./components/ReceiptModal"
import { RecentSalesList } from "./components/RecentSalesList"
import { OvertimeScannerModal } from "./components/OvertimeScannerModal"
import { saveWristbandAssignment } from "@/app/actions/wristbandActions"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

function PosContent() {
    const searchParams = useSearchParams()

    const timeParam = searchParams.get("time")
    const durationParam = searchParams.get("duration")

    const overtimeFeeParam = searchParams.get("overtimeFee")
    const wristbandParam = searchParams.get("wristband")
    const minorParam = searchParams.get("minor")

    const [dniQuery, setDniQuery] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; dni: string; hasWaiver: boolean } | null>(null)
    const [selectedMinors, setSelectedMinors] = useState<CartItem[]>([])

    const [ticketType, setTicketType] = useState("Pase 60 Minutos ($8.500)")
    const [ticketPrice, setTicketPrice] = useState(8500)

    const [entryTime, setEntryTime] = useState<string>("16:00")
    const [selectedColorId, setSelectedColorId] = useState<number>(1)

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
    const [occupancyData, setOccupancyData] = useState<Record<string, number>>({})

    const [pendingAssignment, setPendingAssignment] = useState<{
        orderNumber: string
        items: PendingWristbandItem[]
    } | null>(null)

    const [isReceiptOpen, setIsReceiptOpen] = useState(false)
    const [receiptData, setReceiptData] = useState<SaleReceiptData | null>(null)
    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false)

    const loadOccupancy = async () => {
        const res = await getDashboardData()
        if (res.success && res.data?.occupancyData) {
            setOccupancyData(res.data.occupancyData)
        }
    }

    useEffect(() => {
        loadOccupancy()
    }, [])

    useEffect(() => {
        if (overtimeFeeParam) {
            const feeAmount = Number(overtimeFeeParam)
            if (isNaN(feeAmount) || feeAmount <= 0) return

            const minorNameText = minorParam ? decodeURIComponent(minorParam) : "Menor Excedido"
            const tutorNameText = searchParams.get("tutorName") || searchParams.get("tutor") || "Tutor Registrado"
            const tutorIdParam = searchParams.get("tutorId")
            const code = wristbandParam && wristbandParam.trim() !== ""
                ? decodeURIComponent(wristbandParam).toUpperCase().trim()
                : "RECARGO"

            setSelectedCustomer({
                id: tutorIdParam || "OVERTIME-TUTOR",
                name: decodeURIComponent(tutorNameText),
                dni: "REGISTRADO",
                hasWaiver: true,
            })

            const overtimeCartItem: CartItem = {
                minorName: `${minorNameText} (RECARGO EXCESO DE TIEMPO)`,
                minorAge: 0,
                ticketTypeId: "OVERTIME-PENALTY",
                durationMinutes: 0,
                price: feeAmount,
                wristbandCode: code,
                entryTime: "REGULARIZACIÓN",
            }

            setSelectedMinors((prev) => {
                const exists = prev.some((item) => item.wristbandCode === code && item.ticketTypeId === "OVERTIME-PENALTY")
                if (exists) return prev
                return [...prev, overtimeCartItem]
            })
        }
    }, [overtimeFeeParam, wristbandParam, minorParam, searchParams])

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

    useEffect(() => {
        if (!timeParam) {
            const nowStr = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })
            setEntryTime(nowStr)
        }
    }, [timeParam])

    useEffect(() => {
        if (timeParam) setEntryTime(timeParam)

        if (durationParam) {
            const dur = Number(durationParam)
            setTicketPropsByDuration(dur)
        }
    }, [timeParam, durationParam])

    const handleSelectSlotFromScheduler = (timeStr: string, duration: number, colorId: number) => {
        setEntryTime(timeStr)
        setSelectedColorId(colorId)
        setTicketPropsByDuration(duration)
    }

    const handleAddMultipleMinorsToCart = (minors: MinorFormEntry[]) => {
        let duration = 60
        if (ticketType.includes("120")) duration = 120
        else if (ticketType.includes("90")) duration = 90
        else if (ticketType.includes("30")) duration = 30
        else {
            const match = ticketType.match(/(\d+)\s*Min/)
            if (match) duration = Number(match[1])
        }

        const newCartItems: CartItem[] = minors.map((m) => ({
            minorName: m.fullName.trim(),
            minorAge: Number(m.age) || 0,
            ticketTypeId: `TICKET-${duration}`,
            durationMinutes: duration,
            price: ticketPrice,
            wristbandCode: m.wristbandCode.trim(),
            entryTime: entryTime || "16:00",
        }))

        setSelectedMinors((prev) => [...prev, ...newCartItems])
    }

    const handleAddOvertimeFeeToCart = (data: {
        customerId: string
        customerName: string
        customerDni: string
        minorId: string
        minorName: string
        wristbandCode: string
        overtimeMinutes: number
        penaltyFee: number
    }) => {
        setSelectedCustomer({
            id: data.customerId,
            name: data.customerName,
            dni: data.customerDni,
            hasWaiver: true,
        })

        const overtimeCartItem: CartItem = {
            minorName: `${data.minorName} (RECARGO +${data.overtimeMinutes} MIN)`,
            minorAge: 0,
            ticketTypeId: "OVERTIME-PENALTY",
            durationMinutes: 0,
            price: data.penaltyFee,
            wristbandCode: data.wristbandCode,
            entryTime: "REGULARIZACIÓN",
        }

        setSelectedMinors((prev) => [...prev, overtimeCartItem])
    }

    const handleSuccessSale = async (saleResponse?: any) => {
        const receipt = saleResponse?.receiptData || saleResponse
        if (!receipt) return

        const orderNum = receipt.orderNumber || `ORD-${Date.now().toString().slice(-4)}`
        const createdTickets = receipt.tickets || []

        const formattedReceipt: SaleReceiptData = {
            orderId: receipt.orderId,
            orderNumber: orderNum,
            total: receipt.total,
            paymentMethod: receipt.paymentMethod,
            createdAt: receipt.createdAt,
            customerName: receipt.customerName || selectedCustomer?.name || "Cliente Mostrador",
            customerDni: receipt.customerDni || selectedCustomer?.dni || "S/D",
            tickets: createdTickets.map((t: any) => ({
                ...t,
                wristbandCode: t.wristbandCode || t.qrCode || "",
            })),
        }

        setReceiptData(formattedReceipt)

        const pendingItems: PendingWristbandItem[] = createdTickets
            .filter((t: any) => !t.wristbandCode || t.wristbandCode.startsWith("QR-"))
            .map((t: any) => ({
                ticketId: t.id,
                minorName: t.minorName,
                assigned: false,
            }))

        if (pendingItems.length > 0) {
            setPendingAssignment({
                orderNumber: orderNum,
                items: pendingItems,
            })
        } else {
            setIsReceiptOpen(true)
        }

        setSelectedMinors([])
        setSelectedCustomer(null)
        setDniQuery("")
        window.history.replaceState(null, "", "/dashboard/pos")
        await loadOccupancy()
    }

    const handleCompleteAssignment = async (assignedItems: PendingWristbandItem[]) => {
        const validAssignments = assignedItems.map((item) => ({
            ticketId: item.ticketId,
            minorName: item.minorName,
            wristbandCode: item.wristbandCode || "",
        }))

        await saveWristbandAssignment(
            pendingAssignment?.orderNumber || "",
            validAssignments
        )

        if (receiptData) {
            const updatedTickets = receiptData.tickets.map((t) => {
                const match = validAssignments.find((a) => a.ticketId === t.id)
                return match ? { ...t, wristbandCode: match.wristbandCode } : t
            })
            setReceiptData({ ...receiptData, tickets: updatedTickets })
        }

        setPendingAssignment(null)
        setIsReceiptOpen(true)
    }

    const totalAmount = selectedMinors.reduce((acc, curr) => acc + curr.price, 0)

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <PosHeader />

                {/* ACCESO RÁPIDO PARA EXCESO DE TIEMPO */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h3 className="font-black text-slate-900 text-sm">Operaciones Especiales de Caja</h3>
                        <p className="text-xs text-slate-500 font-medium">Regularización de pulseras activas o pases excedidos</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOvertimeModalOpen(true)}
                        className="bg-red-50 hover:bg-red-100 text-pokido-red border border-red-200 font-black px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                        <span>🔴</span> Re-escanear Pulsera para Recargo
                    </button>
                </div>

                {overtimeFeeParam && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <h4 className="text-xs font-black text-pokido-red uppercase tracking-wider">
                                    Regularización de Exceso de Tiempo
                                </h4>
                                <p className="text-xs text-red-700 font-bold">
                                    Pulsera: {wristbandParam || "Sin pulsera"} | Menor: {minorParam || "No especificado"} | Recargo: ${Number(overtimeFeeParam).toLocaleString("es-CL")}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                window.history.replaceState(null, "", "/dashboard/pos")
                                setSelectedMinors((prev) => prev.filter((i) => i.ticketTypeId !== "OVERTIME-PENALTY"))
                            }}
                            className="text-[11px] font-bold text-red-600 hover:text-red-800 bg-white border border-red-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                        >
                            ✕ Cancelar Recargo
                        </button>
                    </div>
                )}

                {!overtimeFeeParam && entryTime && (
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

                {/* ESTRUCTURA LIMPIA EN 2 COLUMNAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* COLUMNA IZQUIERDA (2 Tercios) */}
                    <div className="lg:col-span-2 space-y-6">
                        <CustomerStep
                            dniQuery={dniQuery}
                            setDniQuery={setDniQuery}
                            selectedCustomer={selectedCustomer}
                            setSelectedCustomer={setSelectedCustomer}
                        />

                        <MinorTicketStep
                            ticketType={ticketType}
                            setTicketType={setTicketType}
                            setTicketPrice={setTicketPrice}
                            entryTime={entryTime}
                            setEntryTime={setEntryTime}
                            selectedColorId={selectedColorId}
                            setSelectedColorId={setSelectedColorId}
                            onAddMultipleMinorsToCart={handleAddMultipleMinorsToCart}
                        />

                        <TimeSlotScheduler
                            isInteractive={true}
                            capacityPerSlot={PARK_TOTAL_MAX_CAPACITY}
                            occupancyData={occupancyData}
                            onSelectSlot={handleSelectSlotFromScheduler}
                        />

                        <RecentSalesList
                            onSelectReceiptToPrint={(receipt) => {
                                setReceiptData(receipt)
                                setIsReceiptOpen(true)
                            }}
                        />
                    </div>

                    {/* COLUMNA DERECHA (1 Tercio) */}
                    <div className="lg:col-span-1 lg:sticky lg:top-6">
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

            {/* MODALES FLOTANTES */}
            {pendingAssignment && (
                <WristbandAssignmentModal
                    orderNumber={pendingAssignment.orderNumber}
                    items={pendingAssignment.items}
                    onCompleteAssignment={handleCompleteAssignment}
                />
            )}

            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                receiptData={receiptData}
            />

            <OvertimeScannerModal
                isOpen={isOvertimeModalOpen}
                onClose={() => setIsOvertimeModalOpen(false)}
                onAddOvertimeFeeToCart={handleAddOvertimeFeeToCart}
            />
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