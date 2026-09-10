"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getTicketTypes() {
    try {
        const rawTicketTypes = await prisma.ticketType.findMany({
            where: { isActive: true },
            orderBy: { durationMinutes: "asc" },
        })

        // Convertir Decimal de Prisma a Number de TypeScript
        const ticketTypes = rawTicketTypes.map((item) => ({
            ...item,
            price: Number(item.price),
        }))

        return { success: true, ticketTypes }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export interface UpdateTicketTypeInput {
    id?: string
    name: string
    durationMinutes: number
    price: number
}

export async function upsertTicketType(data: UpdateTicketTypeInput) {
    try {
        let ticketType

        if (data.id) {
            ticketType = await prisma.ticketType.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    durationMinutes: data.durationMinutes,
                    price: data.price,
                },
            })
        } else {
            ticketType = await prisma.ticketType.create({
                data: {
                    name: data.name,
                    durationMinutes: data.durationMinutes,
                    price: data.price,
                },
            })
        }

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard")

        return { success: true, ticketType }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteTicketType(id: string) {
    try {
        if (!id) return { success: false, error: "ID de tarifa no válido." }

        // Opcion A: Desactivar suavemente (Recomendado para mantener historial de ventas)
        await prisma.ticketType.update({
            where: { id },
            data: { isActive: false },
        })

        // Opción B (Si prefieres borrarla de la BD completamente):
        // await prisma.ticketType.delete({ where: { id } })

        return { success: true }
    } catch (error: any) {
        console.error("Error al eliminar la tarifa:", error)
        return { success: false, error: error.message }
    }
}