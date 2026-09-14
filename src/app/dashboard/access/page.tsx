"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getActiveParkChildren, processChildCheckout, findOrderByQrOrCode, assignWristbandToTicket } from "@/app/actions/accessActions"
import { AccessHeader } from "./components/AccessHeader"
import { ActiveChildrenTable, ActiveChild } from "./components/ActiveChildrenTable"
import { ScannerSidebar } from "./components/ScannerSidebar"
import { calculateOvertimeFee, OvertimeResult } from "@/lib/overtimeLogic"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export default function AccessControlPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [childrenList, setChildrenList] = useState<ActiveChild[]>([])
  const [loading, setLoading] = useState(true)

  // ESTADO PARA CANJEAR RESERVA WEB
  const [webOrderModal, setWebOrderModal] = useState<any | null>(null)
  const [wristbandCodes, setWristbandCodes] = useState<Record<string, string>>({})

  const [overtimeModalData, setOvertimeModalData] = useState<{
    child: ActiveChild
    overtime: OvertimeResult
  } | null>(null)

  const [counts, setCounts] = useState({
    activeInPark: 0,
    waiting: 0,
    totalRegistered: 0,
  })

  const loadData = async () => {
    setLoading(true)
    const res = await getActiveParkChildren()
    setLoading(false)

    if (res.success && res.data) {
      setChildrenList(res.data)
      if (res.counts) {
        setCounts(res.counts)
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 🔑 ESCÁNER INTELIGENTE ÚNICO (Sidebar): Procesa búsquedas de Orden Web o QR
  const handleSmartSearch = async () => {
    const clean = searchQuery.trim().toUpperCase()
    if (!clean) return

    // Si detecta prefijo de orden web o QR, busca la compra para abrir el modal
    if (clean.startsWith("WEB") || clean.startsWith("QR")) {
      const res = await findOrderByQrOrCode(clean)
      if (res.success && res.order) {
        setWebOrderModal(res.order)
      } else {
        alert(res.error || "No se encontró ninguna orden web con ese código.")
      }
    }
  }

  // VINCULAR PULSERA A UN TICKET WEB E INGRESAR AL PARQUE
  const handleAssignWristband = async (ticketId: string, defaultColor: string) => {
    const code = wristbandCodes[ticketId]
    if (!code) {
      alert("Debes ingresar o escanear el código de la pulsera física.")
      return
    }

    const res = await assignWristbandToTicket(ticketId, code, defaultColor)

    if (res.success) {
      alert("¡Pulsera vinculada correctamente! El niño ya está en pista.")
      const updatedOrder = await findOrderByQrOrCode(webOrderModal.orderNumber)
      if (updatedOrder.success) setWebOrderModal(updatedOrder.order)
      loadData()
    } else {
      alert(res.error || "Error al asignar la pulsera.")
    }
  }

  const handleCheckout = async (child: ActiveChild) => {
    const overtime = calculateOvertimeFee(child.rawEndTime, 10, 5000)

    if (overtime.isExpired) {
      setOvertimeModalData({ child, overtime })
      return
    }

    if (!confirm(`¿Confirmar Check-out para ${child.minorName} (${child.wristbandCode || "Sin Código"})?`)) {
      return
    }

    await executeCheckout(child)
  }

  const executeCheckout = async (child: ActiveChild) => {
    const res = await processChildCheckout(child.id, child.ticketId)

    if (res.success) {
      alert(`Check-out exitoso. Pulsera ${child.wristbandCode || ""} liberada.`)
      setOvertimeModalData(null)
      loadData()
    } else {
      alert(res.error || "No se pudo procesar la salida.")
    }
  }

  const handleSendOvertimeToPos = (child: ActiveChild & { customerId?: string }, overtime: OvertimeResult) => {
    const codeToPass = child.wristbandCode?.trim() || child.ticketId || "REC-EXCESO"

    const params = new URLSearchParams({
      overtimeFee: overtime.amountToPay.toString(),
      wristband: codeToPass,
      minor: child.minorName,
      tutorName: child.tutorName,
      tutorId: child.customerId || "",
    })

    router.push(`/dashboard/pos?${params.toString()}`)
  }

  const filteredChildren = childrenList.filter(
    (c) =>
      (c.wristbandCode && c.wristbandCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.minorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const maxCapacity = PARK_TOTAL_MAX_CAPACITY

  const expiredCount = childrenList.filter((c) => {
    const end = new Date(c.rawEndTime)
    return new Date() > end
  }).length

  if (loading) {
    return (
      <div className="p-6 bg-slate-100 min-h-screen flex items-center justify-center font-sans text-slate-500 font-bold">
        Cargando accesos al parque en tiempo real...
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* TABLA PRINCIPAL */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <AccessHeader
            activeCount={counts.activeInPark}
            waitingCount={counts.waiting}
          />
          <ActiveChildrenTable
            childrenList={filteredChildren}
            onCheckout={handleCheckout}
          />
        </div>

        {/* SIDEBAR ÚNICO DE BÚSQUEDA Y AFORO */}
        <ScannerSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCount={counts.activeInPark}
          maxCapacity={maxCapacity}
          expiredCount={expiredCount}
          onSearchSubmit={handleSmartSearch}
        />
      </div>

      {/* MODAL DE CANJE Y ASIGNACIÓN DE PULSERAS DE VENTA WEB */}
      {webOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400">Orden Web Validada</span>
                <h3 className="font-black text-slate-900 text-lg">{webOrderModal.orderNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setWebOrderModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">Tutor: {webOrderModal.customer?.fullName}</p>
              <p className="text-slate-500 font-medium">DNI: {webOrderModal.customer?.dni} | Tel: {webOrderModal.customer?.phone}</p>
              <p className="text-slate-500 font-medium">Email: {webOrderModal.customer?.email}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Entradas de la Reserva</h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {webOrderModal.tickets.map((ticket: any) => (
                  <div key={ticket.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">{ticket.minor?.fullName || "Niño/a"}</span>
                      <span className="text-[10px] font-bold text-pokido-purple">{ticket.ticketType?.name}</span>
                    </div>

                    {ticket.wristband ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        ✅ Pulsera Asignada: {ticket.wristband.code}
                      </span>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Código RFID / Pulsera..."
                          value={wristbandCodes[ticket.id] || ""}
                          onChange={(e) => setWristbandCodes({ ...wristbandCodes, [ticket.id]: e.target.value })}
                          className="bg-white border border-slate-300 font-mono font-bold rounded-xl px-3 py-1.5 text-xs flex-1 sm:w-36 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAssignWristband(ticket.id, ticket.ticketType?.colorCode || "AZUL")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs cursor-pointer whitespace-nowrap"
                        >
                          Asignar & Entrar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECARGO POR TIEMPO EXCEDIDO */}
      {overtimeModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>⚠️</span> Tiempo Excedido Detectado
              </h3>
              <button
                type="button"
                onClick={() => setOvertimeModalData(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-black text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">
                  {overtimeModalData.child.minorName} (Pulsera: {overtimeModalData.child.wristbandCode || "Sin Código"})
                </div>
                <div className="text-slate-500 font-medium">
                  Tutor: {overtimeModalData.child.tutorName} ({overtimeModalData.child.tutorPhone})
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-pokido-red">
                    Monto Recargo Calculado:
                  </span>
                  <span className="text-2xl font-black text-pokido-red">
                    ${overtimeModalData.overtime.amountToPay.toLocaleString("es-CL")}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-red-700 leading-snug">
                  {overtimeModalData.overtime.detailReason}.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  handleSendOvertimeToPos(
                    overtimeModalData.child,
                    overtimeModalData.overtime
                  )
                }
                className="w-full py-3.5 bg-pokido-purple hover:bg-pokido-purple/90 text-white font-extrabold rounded-2xl text-xs transition shadow-lg shadow-pokido-purple/20 cursor-pointer"
              >
                💳 Enviar Cobro de Recargo al POS
              </button>

              <button
                type="button"
                onClick={() => executeCheckout(overtimeModalData.child)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Eximir Recargo & Registrar Salida Directa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}