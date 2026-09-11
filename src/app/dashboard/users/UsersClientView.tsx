"use client"

import { useState, useEffect } from "react"
import { inviteStaffMember, getStaffList, updateStaffRole, deleteStaffMember, AppRole } from "@/app/actions/staffActions"

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrador/a General",
    MANAGER: "Gerente / Encargado/a",
    CASHIER: "Cajero/a (POS & Web)",
    STAFF: "Operario/a de Pista",
}

export default function UsersClientView() {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<AppRole>("CASHIER")
    const [loading, setLoading] = useState(false)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
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
            setMessage({ type: "error", text: res.error || "Ocurrió un error al enviar la invitación." })
        }
        setLoading(false)
    }

    const handleRoleChange = async (userId: string, newRole: AppRole) => {
        setActionLoadingId(userId)
        setMessage(null)

        const res = await updateStaffRole(userId, newRole)

        if (res.success) {
            setMessage({ type: "success", text: "Rol actualizado correctamente." })
            loadStaff()
        } else {
            setMessage({ type: "error", text: res.error || "No se pudo cambiar el rol." })
        }
        setActionLoadingId(null)
    }

    const handleDelete = async (userId: string, email: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la cuenta de ${email}? Perderá el acceso al sistema.`)
        if (!confirmed) return

        setActionLoadingId(userId)
        setMessage(null)

        const res = await deleteStaffMember(userId)

        if (res.success) {
            setMessage({ type: "success", text: "Empleado eliminado exitosamente." })
            loadStaff()
        } else {
            setMessage({ type: "error", text: res.error || "Error al eliminar el empleado." })
        }
        setActionLoadingId(null)
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen font-sans text-slate-800 space-y-6">
            <div>
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>👥</span> Gestión de Personal Pokiddo Park
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Invita a nuevos colaboradores, modifica sus roles o elimina sus accesos según tu necesidad operativa.
                </p>
            </div>

            {/* FORMULARIO DE INVITACIÓN */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>✨</span> Invitar Nuevo Empleado
                </h2>

                <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="email"
                        required
                        placeholder="ejemplo@pokiddopark.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-pokido-purple/20 focus:border-pokido-purple transition placeholder:text-slate-400"
                    />

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as AppRole)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-pokido-purple/20 focus:border-pokido-purple transition cursor-pointer"
                    >
                        <option value="CASHIER">Cajero/a (POS & Web)</option>
                        <option value="STAFF">Operario/a de Pista (Pulseras & Tiempos)</option>
                        <option value="MANAGER">Gerente / Encargado/a</option>
                        <option value="ADMIN">Administrador/a General</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-pokido-purple hover:bg-pokido-purple/90 active:scale-95 text-white px-6 py-2.5 rounded-2xl font-extrabold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                        {loading ? "Enviando..." : "Enviar Invitación"}
                    </button>
                </form>

                {message && (
                    <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${message.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}>
                        <span>{message.type === "success" ? "✅" : "⚠️"}</span>
                        <span>{message.text}</span>
                    </div>
                )}
            </div>

            {/* TABLA DE PERSONAL ACTIVO CON ACCIONES */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span>📋</span> Personal Registrado en Sistema
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                <th className="py-4 px-6">Usuario</th>
                                <th className="py-4 px-6">Correo Electrónico</th>
                                <th className="py-4 px-6">Rol Actual</th>
                                <th className="py-4 px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium">
                            {staff.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/80 transition">
                                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                                        <img
                                            src={member.imageUrl}
                                            alt={member.firstName || "Avatar"}
                                            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                        />
                                        <span>
                                            {member.firstName ? `${member.firstName} ${member.lastName || ""}` : "Pendiente de registro"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{member.email}</td>

                                    {/* CAMBIO DE ROL DIRECTO */}
                                    <td className="py-4 px-6">
                                        <select
                                            disabled={actionLoadingId === member.id}
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value as AppRole)}
                                            className="bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pokido-purple/20 transition cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="CASHIER">{ROLE_LABELS.CASHIER}</option>
                                            <option value="STAFF">{ROLE_LABELS.STAFF}</option>
                                            <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
                                            <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                                        </select>
                                    </td>

                                    {/* BOTÓN ELIMINAR */}
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            type="button"
                                            disabled={actionLoadingId === member.id}
                                            onClick={() => handleDelete(member.id, member.email)}
                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoadingId === member.id ? "Procesando..." : "🗑️ Eliminar"}
                                        </button>
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