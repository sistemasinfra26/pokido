"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Obtener porcentaje de seña (o retornar 30% por defecto si no existe)
export async function getPartyDepositPercentage(): Promise<number> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "PARTY_DEPOSIT_PERCENTAGE" },
        })
        return setting ? Number(setting.value) : 30
    } catch {
        return 30
    }
}

// Guardar nuevo porcentaje desde el panel de configuraciones
export async function updatePartyDepositPercentage(percentage: number) {
    try {
        await prisma.systemSetting.upsert({
            where: { key: "PARTY_DEPOSIT_PERCENTAGE" },
            update: { value: String(percentage) },
            create: {
                key: "PARTY_DEPOSIT_PERCENTAGE",
                value: String(percentage),
                description: "Porcentaje de seña requerido para reservas de cumpleaños online",
            },
        })

        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/parties")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTicketBasePrice(price: number) {
    try {
        await prisma.systemSetting.upsert({
            where: { key: "TICKET_BASE_PRICE" },
            update: { value: String(price) },
            create: {
                key: "TICKET_BASE_PRICE",
                value: String(price),
                description: "Precio base para el cálculo de pases de sala",
            },
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}