"use client"

import { useEffect, useState } from "react"
// 🔑 CORRECCIÓN: Importamos la función desde systemSettingsActions
import { updatePartyDepositPercentage } from "@/app/actions/systemSettingsActions"

interface PartyDepositSettingsCardProps {
    initialPercentage: number
    onReload: () => void
}

export function PartyDepositSettingsCard({ initialPercentage, onReload }: PartyDepositSettingsCardProps) {
    const [percentage, setPercentage] = useState<number>(initialPercentage)
    const [loading, setLoading] = useState(false)

    // 🔑 Sincronizar el input si cambia el valor que viene de la BD
    useEffect(() => {
        if (typeof initialPercentage === "number") {
            setPercentage(initialPercentage)
        }
    }, [initialPercentage])

    const handleSave = async () => {
        setLoading(true)
        const res = await updatePartyDepositPercentage(percentage)
        setLoading(false)

        if (res.success) {
            alert("¡Porcentaje de seña actualizado con éxito!")
            onReload()
        } else {
            alert(res.error || "No se pudo actualizar el porcentaje de seña.")
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
                <span className="p-2.5 bg-pokido-purple/10 text-pokido-purple rounded-2xl text-lg">💰</span>
                <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Seña para Reservas de Cumpleaños</h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Porcentaje del valor total del salón que se cobrará al cliente por Mercado Pago al agendar online.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
                <div className="relative w-36">
                    <input
                        type="number"
                        min={10}
                        max={100}
                        value={percentage}
                        onChange={(e) => setPercentage(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-slate-900 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                    />
                    <span className="absolute right-3 top-3.5 font-black text-slate-400 text-xs">%</span>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-pokido-purple hover:bg-pokido-purple/90 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition cursor-pointer shadow-md shadow-pokido-purple/20"
                >
                    {loading ? "Guardando..." : "Guardar Porcentaje"}
                </button>
            </div>
        </div>
    )
}