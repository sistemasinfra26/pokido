"use client"

import { useState, useEffect } from "react"
import { inviteStaffMember, getStaffList } from "@/app/actions/staffActions"

export default function UsersClientView() {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<"cajera" | "operador" | "admin">("cajera")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [staff, setStaff] = useState<any[]>([])

    const loadStaff = async () => {
        const res = await getStaffList()
        if (res.success) setStaff(res.staff)
    }

    useEffect(() => {
        loadStaff()
    }, [])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const res = await inviteStaffMember(email, role)

        if (res.success) {
            setMessage({ type: "success", text: `Invitación enviada exitosamente a ${email}` })
            setEmail("")
            loadStaff()
        } else {
            setMessage({ type: "error", text: res.error || "Ocurrió un error." })
        }
        setLoading(false)
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl font-black text-white">Gestión de Personal</h1>
                <p className="text-sm text-slate-400">Invita a nuevos empleados y administra sus accesos.</p>
            </div>

            {/* FORMULARIO DE INVITACIÓN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Invitar Nuevo Empleado</h2>

                <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="email"
                        required
                        placeholder="correo@pokidopark.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pokido-purple"
                    />

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pokido-purple"
                    >
                        <option value="cajera">Cajera / POS</option>
                        <option value="operador">Operador de Pista</option>
                        <option value="admin">Administrador</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-pokido-purple hover:bg-pokido-purple/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? "Enviando..." : "Enviar Invitación"}
                    </button>
                </form>

                {message && (
                    <p className={`mt-4 text-xs font-semibold ${message.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                        {message.text}
                    </p>
                )}
            </div>

            {/* TABLA DE PERSONAL ACTIVO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Personal Activo</h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs uppercase bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="py-3 px-4">Usuario</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Rol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {staff.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-800/30">
                                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-3">
                                        <img src={member.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                                        {member.firstName ? `${member.firstName} ${member.lastName || ""}` : "Pendiente de registro"}
                                    </td>
                                    <td className="py-3 px-4">{member.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${member.role === "admin"
                                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}