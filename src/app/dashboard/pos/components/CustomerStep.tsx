"use client"

import { useState, useEffect } from "react"
import { findCustomerByDni, createQuickCustomer } from "@/app/actions/customerActions"
import { ExpressWaiverModal } from "./ExpressWaiverModal"

export interface CustomerSelected {
    id: string
    name: string
    dni: string
    hasWaiver: boolean
}

interface CustomerStepProps {
    dniQuery: string
    setDniQuery: (query: string) => void
    selectedCustomer: CustomerSelected | null
    setSelectedCustomer: (customer: CustomerSelected | null) => void
}

export function CustomerStep({
    dniQuery,
    setDniQuery,
    selectedCustomer,
    setSelectedCustomer,
}: CustomerStepProps) {
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showWaiverModal, setShowWaiverModal] = useState(false)
    const [notFound, setNotFound] = useState(false)

    const [newFullName, setNewFullName] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [creating, setCreating] = useState(false)

    // Búsqueda centralizada
    const executeSearch = async (query: string) => {
        const cleanDni = query.trim()
        if (!cleanDni) return

        setLoading(true)
        setNotFound(false)

        const res = await findCustomerByDni(cleanDni)
        setLoading(false)

        if (res.success && res.customer) {
            setSelectedCustomer({
                id: res.customer.id,
                name: res.customer.name,
                dni: res.customer.dni,
                hasWaiver: Boolean(res.customer.hasWaiver),
            })
            setNotFound(false)
        } else {
            setSelectedCustomer(null)
            setNotFound(true)
        }
    }

    // Búsqueda en tiempo real mediante debounce al escribir
    useEffect(() => {
        const cleanDni = dniQuery.trim()

        if (selectedCustomer && selectedCustomer.dni === cleanDni) {
            return
        }

        if (cleanDni.length < 4) {
            setNotFound(false)
            return
        }

        const timer = setTimeout(() => {
            executeSearch(cleanDni)
        }, 400)

        return () => clearTimeout(timer)
    }, [dniQuery])

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFullName || !dniQuery || !newPhone) return

        setCreating(true)
        const res = await createQuickCustomer({
            fullName: newFullName,
            dni: dniQuery.trim(),
            phone: newPhone,
        })
        setCreating(false)

        if (res.success && res.customer) {
            setSelectedCustomer({
                id: res.customer.id,
                name: res.customer.name || newFullName,
                dni: res.customer.dni,
                hasWaiver: Boolean(res.customer.hasWaiver),
            })
            setShowModal(false)
            setNotFound(false)
            setNewFullName("")
            setNewPhone("")
        } else {
            alert(res.error || "Error al registrar cliente")
        }
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pokido-purple text-white text-xs flex items-center justify-center font-black">
                    1
                </span>
                Datos del Tutor / Responsable
            </h2>

            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Ingrese DNI o RUT del tutor..."
                        value={dniQuery}
                        onChange={(e) => {
                            setDniQuery(e.target.value)
                            setNotFound(false)
                        }}
                        onKeyDown={(e) => e.key === "Enter" && executeSearch(dniQuery)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    />
                    {loading && (
                        <span className="absolute right-4 top-3.5 text-xs font-bold text-pokido-purple animate-pulse">
                            Buscando...
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => executeSearch(dniQuery)}
                    className="bg-pokido-purple hover:bg-pokido-purple/90 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md shadow-pokido-purple/20 cursor-pointer"
                >
                    {loading ? "Buscando..." : "Buscar Tutor"}
                </button>
            </div>

            {notFound && !loading && (
                <div className="p-4 bg-pokido-orange/10 border border-pokido-orange/20 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-pokido-orange">
                        ⚠️ No existe un cliente registrado con DNI: {dniQuery}
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="bg-pokido-orange text-white font-bold px-3 py-1.5 rounded-xl text-xs transition hover:bg-pokido-orange/90 shadow-sm cursor-pointer"
                    >
                        ➕ Registrar Nuevo
                    </button>
                </div>
            )}

            {selectedCustomer && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                        <div className="font-bold text-slate-900 text-sm">
                            {selectedCustomer.name}
                        </div>
                        <div className="text-xs text-slate-400">
                            DNI: {selectedCustomer.dni}
                        </div>
                    </div>

                    <div>
                        {selectedCustomer.hasWaiver ? (
                            <span className="text-xs font-bold text-pokido-green bg-pokido-green/10 border border-pokido-green/20 px-3 py-1 rounded-full">
                                ✓ Deslinde Válido
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowWaiverModal(true)}
                                className="text-xs font-bold text-pokido-red bg-pokido-red/10 hover:bg-pokido-red/20 border border-pokido-red/20 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                            >
                                ✍️ Firmar Deslinde Ahora
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL REGISTRO NUEVO */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">
                                Registrar Nuevo Tutor
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">
                                    DNI / Identificación
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={dniQuery}
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Juan Pérez"
                                    value={newFullName}
                                    onChange={(e) => setNewFullName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pokido-purple text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">
                                    Teléfono / WhatsApp *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. +56 9 1234 5678"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pokido-purple text-slate-800"
                                />
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-pokido-purple hover:bg-pokido-purple/90 text-white font-bold py-2.5 rounded-xl text-xs transition"
                                >
                                    {creating ? "Guardando..." : "Guardar Tutor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL FIRMA EXPRESS */}
            {showWaiverModal && selectedCustomer && (
                <ExpressWaiverModal
                    customer={selectedCustomer}
                    onClose={() => setShowWaiverModal(false)}
                    onWaiverSigned={() => {
                        setSelectedCustomer({
                            ...selectedCustomer,
                            hasWaiver: true,
                        })
                        setShowWaiverModal(false)
                    }}
                />
            )}
        </div>
    )
}