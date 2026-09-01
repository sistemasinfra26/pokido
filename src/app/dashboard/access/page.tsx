"use client"

import { useEffect, useState } from "react"
import { getActiveParkChildren, processChildCheckout } from "@/app/actions/accessActions"
import { AccessHeader } from "./components/AccessHeader"
import { ActiveChildrenTable, ActiveChild } from "./components/ActiveChildrenTable"
import { ScannerSidebar } from "./components/ScannerSidebar"

export default function AccessControlPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [childrenList, setChildrenList] = useState<ActiveChild[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para separar conteo en Pista / Espera
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

  const handleCheckout = async (child: ActiveChild) => {
    if (!confirm(`¿Confirmar Check-out para ${child.minorName} (${child.wristbandCode})?`)) {
      return
    }

    const res = await processChildCheckout(child.id, child.ticketId)

    if (res.success) {
      alert(`Check-out exitoso. Pulsera ${child.wristbandCode} liberada.`)
      loadData()
    } else {
      alert(res.error || "No se pudo procesar la salida.")
    }
  }

  const filteredChildren = childrenList.filter(
    (c) =>
      c.wristbandCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.minorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const maxCapacity = 30

  // Cálculo dinámico para la barra lateral: niños cuya hora fin ya expiró
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
    <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header con conteo diferenciado entre 'En Pista' y 'En Espera' */}
          <AccessHeader
            activeCount={counts.activeInPark}
            waitingCount={counts.waiting}
          />
          <ActiveChildrenTable
            childrenList={filteredChildren}
            onCheckout={handleCheckout}
          />
        </div>

        <ScannerSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCount={counts.activeInPark}
          maxCapacity={maxCapacity}
          expiredCount={expiredCount}
        />
      </div>
    </div>
  )
}