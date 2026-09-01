"use client"

import { useState } from "react"
import { createExpressWaiver } from "@/app/actions/waiverActions"

interface ExpressWaiverModalProps {
    customer: { id: string; name: string; dni: string }
    onClose: () => void
    onWaiverSigned: () => void
}

export function ExpressWaiverModal({ customer, onClose, onWaiverSigned }: ExpressWaiverModalProps) {
    const [loading, setLoading] = useState(false)
    const [signedName, setSignedName] = useState(customer.name)
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    const handleSign = async () => {
        if (!acceptedTerms) return
        setLoading(true)

        const res = await createExpressWaiver({
            customerId: customer.id,
            signedName,
        })

        setLoading(false)

        if (res.success) {
            onWaiverSigned()
            onClose()
        } else {
            alert(res.error || "Error al registrar la firma")
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Firma Digital de Deslinde (Waiver)</h3>
                        <p className="text-xs text-slate-400">Tutor: {customer.name} (DNI: {customer.dni})</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
                        ✕
                    </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2 max-h-36 overflow-y-auto font-medium leading-relaxed">
                    <p className="font-bold text-slate-900">DECLARACIÓN JURADA Y EXENCIÓN DE RESPONSABILIDAD</p>
                    <p>
                        Al firmar este documento, el/la titular declara conocer y aceptar los riesgos físicos inherentes a las actividades de salto en trampolines, circuito ninja y demás atracciones de Pokido Park.
                    </p>
                    <p>
                        Confirmo tener la representación legal o autorización sobre los menores que ingresan a mi cargo y que los mismos se encuentran en condiciones óptimas de salud.
                    </p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Nombre y Apellido del Firmante</label>
                        <input
                            type="text"
                            value={signedName}
                            onChange={(e) => setSignedName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                        />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-pokido-purple focus:ring-pokido-purple h-4 w-4"
                        />
                        <span className="text-xs text-slate-700 font-semibold leading-tight">
                            Acepto los términos, condiciones y la exención de responsabilidad de Pokido Park con validez por 1 año.
                        </span>
                    </label>
                </div>

                <div className="pt-2 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={!acceptedTerms || loading}
                        onClick={handleSign}
                        className="flex-1 bg-pokido-purple hover:bg-pokido-purple/90 disabled:opacity-40 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg shadow-pokido-purple/20"
                    >
                        {loading ? "Firmando..." : "✍️ Confirmar y Firmar"}
                    </button>
                </div>
            </div>
        </div>
    )
}