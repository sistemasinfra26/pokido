"use server"

import { prisma } from "@/lib/prisma"
import { ShiftStatus, PaymentMethod } from "@prisma/client"
import { revalidatePath } from "next/cache"

// 🔑 Obtener el turno de caja actualmente abierto
export async function getActiveCashShift(staffId?: string) {
    try {
        const activeShift = await prisma.cashShift.findFirst({
            where: {
                status: ShiftStatus.OPEN,
                ...(staffId ? { staffId } : {}),
            },
            include: {
                payments: true,
                staff: true,
            },
            orderBy: { openedAt: "desc" },
        })

        if (!activeShift) return { success: true, activeShift: null }

        // Calcular totales acumulados en vivo
        const cashTotal = activeShift.payments
            .filter((p) => p.method === PaymentMethod.CASH || (p.method as string) === "EFECTIVO")
            .reduce((acc, curr) => acc + Number(curr.amount), 0)

        const cardTotal = activeShift.payments
            .filter((p) => p.method !== PaymentMethod.CASH && (p.method as string) !== "EFECTIVO")
            .reduce((acc, curr) => acc + Number(curr.amount), 0)

        const expectedCashInDrawer = Number(activeShift.initialCash) + cashTotal

        return {
            success: true,
            activeShift: {
                ...activeShift,
                initialCash: Number(activeShift.initialCash),
                cashTotal,
                cardTotal,
                expectedCashInDrawer,
            },
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 🔑 Abrir nuevo turno de caja
export async function openCashShift(staffId: string, initialCash: number) {
    try {
        // 1. Verificar o crear la caja registradora física por defecto
        let defaultRegister = await prisma.cashRegister.findFirst({
            where: { isActive: true },
        })

        if (!defaultRegister) {
            defaultRegister = await prisma.cashRegister.create({
                data: {
                    name: "Caja Principal POS",
                    branchName: "Pokiddo Park Central",
                    isActive: true,
                },
            })
        }

        // 2. Verificar si el staff existe
        let validStaffId = staffId
        const staffExists = await prisma.profile.findUnique({
            where: { id: staffId },
        })

        if (!staffExists) {
            const fallbackProfile = await prisma.profile.findFirst()
            if (!fallbackProfile) {
                return { success: false, error: "No existe un perfil de staff válido para asociar la caja." }
            }
            validStaffId = fallbackProfile.id
        }

        // 3. Verificar si ya existe una caja abierta en el parque
        const existing = await prisma.cashShift.findFirst({
            where: { status: ShiftStatus.OPEN },
        })

        if (existing) {
            return { success: false, error: "Ya existe un turno de caja abierto en el sistema." }
        }

        // 4. Crear el turno asignando cashRegisterId
        const newShift = await prisma.cashShift.create({
            data: {
                cashRegisterId: defaultRegister.id, // 🔑 AHORA SATISFACE EL REQUERIMIENTO
                staffId: validStaffId,
                initialCash,
                status: ShiftStatus.OPEN,
            },
        })

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/shift")

        return { success: true, shiftId: newShift.id }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 🔑 Cerrar y realizar Arqueo de Caja
export async function closeCashShift(shiftId: string, physicalCashAmount: number, notes?: string) {
    try {
        const shift = await prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: { payments: true },
        })

        if (!shift || shift.status === ShiftStatus.CLOSED) {
            return { success: false, error: "El turno de caja no existe o ya fue cerrado." }
        }

        const cashSales = shift.payments
            .filter((p) => p.method === PaymentMethod.CASH || (p.method as string) === "EFECTIVO")
            .reduce((acc, curr) => acc + Number(curr.amount), 0)

        const expectedCash = Number(shift.initialCash) + cashSales
        const difference = physicalCashAmount - expectedCash

        await prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                closedAt: new Date(),
                actualCash: physicalCashAmount,
                expectedCash,
                difference,
                notes,
                status: ShiftStatus.CLOSED,
            },
        })

        revalidatePath("/dashboard/pos")
        revalidatePath("/dashboard/shift")

        return {
            success: true,
            summary: {
                initialCash: Number(shift.initialCash),
                cashSales,
                expectedCash,
                actualCash: physicalCashAmount,
                difference,
            },
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}