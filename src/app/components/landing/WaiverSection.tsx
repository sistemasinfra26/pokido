import Link from "next/link"

export function WaiverSection() {
    return (
        <section id="deslinde" className="py-20 bg-gradient-to-br from-pokido-purple/20 via-slate-950 to-slate-950 border-t border-slate-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center">
                <span className="bg-pokido-red/10 text-pokido-red border border-pokido-red/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                    Requisito Obligatorio
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
                    Firma tu Deslinde Digital (Waiver)
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
                    Para garantizar la seguridad de todos los visitantes, todos los adultos y tutores de menores deben completar la exención de responsabilidad antes de ingresar al parque. ¡Tiene validez por 1 año!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/waiver/new" className="w-full sm:w-auto bg-pokido-purple hover:bg-pokido-purple/90 text-white font-black px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-pokido-purple/20">
                        Firmar Deslinde en Línea
                    </Link>
                    <Link href="/waiver/check" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-8 py-4 rounded-xl text-lg border border-slate-700 transition">
                        Consultar Firma Existente
                    </Link>
                </div>
            </div>
        </section>
    )
}