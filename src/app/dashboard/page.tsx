"use client"

import { useEffect, useState } from "react"
import { getDashboardData } from "@/app/actions/dashboardActions"
import { DashboardHeader } from "./components/DashboardHeader"
import { KpiCards } from "./components/KpiCards"
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

    const [alertItems, setAlertItems] = useState<AlertItem[]>([])
    const [partyRooms, setPartyRooms] = useState<PartyRoomItem[]>([])
    const [occupancyData, setOccupancyData] = useState<Record<string, number>>({})

    const loadData = async () => {
        setLoading(true)
        const res = await getDashboardData()
        setLoading(false)

        if (res.success && res.data) {
            const rawData = res.data as any

            setKpis({
                ...rawData.kpis,
                aforoMax: rawData.kpis?.aforoMax || PARK_TOTAL_MAX_CAPACITY,
            })
            setAlertItems(rawData.alertItems || [])
            setPartyRooms(rawData.partyRooms || [])

            // Cargar ocupación si viene del servidor o procesar el listado de niños
            if (rawData.occupancyData) {
                setOccupancyData(rawData.occupancyData)
            } else if (rawData.childrenList) {
                const map: Record<string, number> = {}
                rawData.childrenList.forEach((child: any) => {
                    const timeKey = child.slotStartTime || child.purchaseTime?.slice(0, 5)
                    if (timeKey) {
                        map[timeKey] = (map[timeKey] || 0) + 1
                    }
                })
                setOccupancyData(map)
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

            {/* TARJETAS DE MÉTRICAS */}
            <KpiCards kpis={kpis} />

            {/* CRONOGRAMA DE TURNOS Y COLORES DE PULSERA */}
            <TimeSlotScheduler
                isInteractive={false}
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