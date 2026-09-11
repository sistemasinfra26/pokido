import { prisma } from "@/lib/prisma"
import Link from "next/link"

interface ConfirmPageProps {
    searchParams: Promise<{ order?: string; status?: string }>
}

export default async function ConfirmationPage({ searchParams }: ConfirmPageProps) {
    const { order: orderNumber, status } = await searchParams

    if (!orderNumber || status !== "approved") {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center max-w-md space-y-4">
                    <span className="text-4xl">⚠️</span>
                    <h1 className="text-xl font-black">Pago en Proceso o Incompleto</h1>
                    <p className="text-xs text-slate-400">
                        El estado de tu pago no pudo ser verificado de inmediato. Si se acreditó, recibirás los pases por correo.
                    </p>
                    <Link href="/" className="inline-block bg-pokido-cyan text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs">
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        )
    }

    const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { customer: true, tickets: true },
    })

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center max-w-md space-y-6">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-500/30">
                    ✓
                </div>

                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-white">¡Pago Aprobado!</h1>
                    <p className="text-xs text-slate-400">
                        Orden <strong>{order?.orderNumber}</strong> | Cliente: <strong>{order?.customer?.fullName}</strong>
                    </p>
                </div>

                <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl">
                    <div className="w-44 h-44 bg-slate-900 text-white flex flex-col items-center justify-center font-mono font-bold text-center text-xs p-2 rounded-xl">
                        <span>📱 SCAN EN RECEPCIÓN</span>
                        <span className="text-[10px] text-pokido-cyan mt-2">{order?.orderNumber}</span>
                    </div>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Muestra este código en recepción al llegar a Pokiddo Park para recibir tus pulseras físicas. Te hemos enviado un respaldo a <strong>{order?.customer?.email}</strong>.
                </p>
            </div>
        </div>
    )
}