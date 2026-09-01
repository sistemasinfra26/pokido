import Link from "next/link"

export function PricingSection() {
    const passes = [
        {
            name: "Pase 60 Minutos",
            price: "$8.500",
            description: "Ideal para una sesión rápida de energía.",
            features: ["Acceso a todas las zonas", "Pulsera de tiempo activa", "Supervisión de monitores"],
            highlight: false,
        },
        {
            name: "Pase 120 Minutos",
            price: "$14.000",
            description: "La experiencia completa Pokido. El más vendido.",
            features: ["Acceso total a atracciones", "Pulsera de tiempo extendida", "Descuento en Cafetería", "Acceso a Ninja Course"],
            highlight: true,
        },
        {
            name: "Calcetines Antideslizantes",
            price: "$2.500",
            description: "Uso obligatorio por seguridad (Reutilizables).",
            features: ["Goma de agarre especial", "Lavables", "Te los llevas a casa"],
            highlight: false,
        },
    ]

    return (
        <section id="precios" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                        Pases y <span className="text-pokido-purple">Entradas</span>
                    </h2>
                    <p className="text-slate-400 mt-4 text-lg">Selecciona la duración de tu pase. Recuerda ingresar con deslinde firmado.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {passes.map((pass, index) => (
                        <div
                            key={index}
                            className={`rounded-3xl p-8 flex flex-col justify-between relative ${pass.highlight
                                ? "bg-slate-900 border-2 border-pokido-orange shadow-2xl shadow-pokido-orange/10"
                                : "bg-slate-950 border border-slate-800"
                                }`}
                        >
                            {pass.highlight && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pokido-orange text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                                    Más Popular
                                </span>
                            )}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{pass.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">{pass.description}</p>
                                <div className="text-4xl font-black text-white mb-6">{pass.price}</div>
                                <ul className="space-y-3 mb-8">
                                    {pass.features.map((feat, i) => (
                                        <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                                            <span className="text-pokido-green font-bold">✓</span> {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Link
                                href="#deslinde"
                                className={`w-full text-center py-3.5 rounded-xl font-bold transition ${pass.highlight
                                    ? "bg-pokido-orange text-white hover:bg-pokido-orange/90"
                                    : "bg-slate-800 text-white hover:bg-slate-700"
                                    }`}
                            >
                                Comprar Pase
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}