"use client"

import { useEffect, useState } from "react"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { DashboardHeader } from "./components/DashboardHeader"
import { KpiCards, ActiveChild } from "./components/KpiCards"
import { RealtimeAlerts, AlertItem } from "./components/RealtimeAlerts"
import { TodayBookingsSummary, PartyRoomItem } from "./components/TodayBookingsSummary"
import { TimeSlotScheduler } from "./components/TimeSlotScheduler"
import { PARK_TOTAL_MAX_CAPACITY } from "@/lib/capacityLogic"

export default function DashboardSummaryPage() {
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState({
        aforoActual: 0,
        aforoMax: PARK_TOTAL_MAX_CAPACITY,
        ventasHoy: "$ 0",
        pedidosTotal: 0,
        cumpleanosHoy: 0,
        alertasTiempo: 0,
    })

    const [activeChildren, setActiveChildren] = useState<ActiveChild[]>([])
    const [alertItems, setAlertItems] = useState<AlertItem[]>([])
    const [partyRooms, setPartyRooms] = useState<PartyRoomItem[]>([])
    const [occupancyData, setOccupancyData] = useState<Record<string, number>>({})

    const loadData = async () => {
        setLoading(true)
        const res = await getDashboardData()
        setLoading(false)

        if (res.success && res.data) {
            const rawData = res.data as any

            // Fallback en cascada para garantizar la lectura del aforo real
            const realAforo =
                rawData.kpis?.aforoActual ??
                rawData.kpis?.activeCount ??
                rawData.activeChildren?.length ??
                0

            setKpis({
                ...rawData.kpis,
                aforoActual: Number(realAforo),
                aforoMax: rawData.kpis?.aforoMax || PARK_TOTAL_MAX_CAPACITY,
            })

            if (rawData.activeChildren) {
                setActiveChildren(rawData.activeChildren)
            }

            setAlertItems(rawData.alertItems || [])
            setPartyRooms(rawData.partyRooms || [])

            if (rawData.occupancyData) {
                setOccupancyData(rawData.occupancyData)
            }
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="p-6 bg-slate-100 min-h-screen flex items-center justify-center font-sans text-slate-500 font-bold">
                Cargando métricas del parque en tiempo real...
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
            <DashboardHeader />

            {/* TARJETAS DE MÉTRICAS CON LISTA Y DATOS SINCRONIZADOS */}
            <KpiCards kpis={kpis} childrenList={activeChildren} />

            {/* CRONOGRAMA INTERACTIVO */}
            <TimeSlotScheduler
                isInteractive={true}
                capacityPerSlot={kpis.aforoMax || PARK_TOTAL_MAX_CAPACITY}
                occupancyData={occupancyData}
            />

            {/* ALERTAS EN VIVO Y SALONES DE CUMPLEAÑOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RealtimeAlerts alerts={alertItems} />
                <TodayBookingsSummary rooms={partyRooms} />
            </div>
        </div>
    )
}