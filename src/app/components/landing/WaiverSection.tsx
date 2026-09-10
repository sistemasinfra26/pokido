"use client"

import Link from "next/link"

export function WaiverSection() {
    return (
        <section className="max-w-7xl mx-auto px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-pokido-orange tracking-wider block">
                        📋 Requisito Obligatorio de Salto
                    </span>
                    <h3 className="text-2xl font-black text-white">
                        Deslinde de Responsabilidad (Waiver Digital)
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl font-medium">
                        Todos los saltadores deben contar con una declaración jurada de responsabilidad firmada por un adulto mayor de edad. Puedes completarlo online al comprar tus entradas.
                    </p>
                </div>

                <Link
                    href="/reserva"
                    className="bg-pokido-orange hover:bg-pokido-orange/90 text-white font-black px-6 py-3.5 rounded-2xl transition text-xs shadow-lg shadow-pokido-orange/20 whitespace-nowrap"
                >
                    Firmar / Comprar Entrada
                </Link>
            </div>
        </section>
    )
}