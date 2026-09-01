import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <span className="inline-block bg-pokido-purple/15 text-pokido-purple font-semibold text-xs px-4 py-1.5 rounded-full border border-pokido-purple/30 mb-6 uppercase tracking-widest">
                    ¡Apertura de reservas fin de semana!
                </span>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-6">
                    SALTA. VUELA. <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pokido-purple via-pokido-orange to-pokido-red">
                        VIVE LA EXPERIENCIA POKIDO.
                    </span>
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
                    Más de 1.500 m² de trampolines, piscinas de espuma, circuito ninja y salones privados para celebrar los mejores cumpleaños.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="#precios" className="w-full sm:w-auto bg-gradient-to-r from-pokido-orange to-pokido-red hover:opacity-90 text-white font-black px-8 py-4 rounded-2xl text-lg transition shadow-xl shadow-pokido-orange/20">
                        Reservar Mi Pase Ahora
                    </Link>
                    <Link href="#cumpleanos" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-8 py-4 rounded-2xl text-lg border border-slate-800 transition">
                        Ver Packs de Cumpleaños
                    </Link>
                </div>
            </div>
        </section>
    )
}