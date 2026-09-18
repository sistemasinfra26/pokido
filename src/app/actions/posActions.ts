"use server"

import { prisma } from "@/lib/prisma"
import { PaymentMethod, WristbandStatus, TicketStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export interface CartItemInput {
    minorName: string
    minorAge: number
    ticketTypeId: string
    durationMinutes: number
    price: number
    wristbandCode: string
    entryTime?: string
}

export interface CreatePosOrderInput {
    customerId: string
    staffProfileId?: string
    cashShiftId?: string
    paymentMethod: PaymentMethod
    items: CartItemInput[]
}

export async function processPosSale(data: CreatePosOrderInput) {
    try {
        const { customerId, staffProfileId, cashShiftId, paymentMethod, items } = data

        if (!items || items.length === 0) {
            return { success: false, error: "El carrito no contiene productos." }
        }

        const totalAmount = items.reduce((acc, curr) => acc + curr.price, 0)
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

        const result = await prisma.$transaction(async (tx) => {

            // 1. VALIDAR O BUSCAR CLIENTE REAL EN BASE DE DATOS
            let validCustomerId = customerId
            let customerData = null

            if (validCustomerId) {
                customerData = await tx.customer.findUnique({
                    where: { id: validCustomerId },
                })
                if (!customerData) validCustomerId = ""
            }

            if (!validCustomerId) {
                customerData = await tx.customer.findFirst({
                    where: { dni: "OVERTIME-DNI" },
                })

                if (!customerData) {
                    customerData = await tx.customer.create({
                        data: {
                            fullName: "Cliente Regularización / Mostrador",
                            dni: "OVERTIME-DNI",
                            phone: "000000000",
                            email: "recargos@pokidopark.com",
                        },
                    })
                }
                validCustomerId = customerData.id
            }

            // 2. OBTENER O CREAR STAFF VÁLIDO
            let validStaffId = staffProfileId

            if (validStaffId) {
                const existingProfile = await tx.profile.findUnique({
                    where: { id: validStaffId },
                })
                if (!existingProfile) validStaffId = undefined
            }

            if (!validStaffId) {
                const firstProfile = await tx.profile.findFirst()
                if (firstProfile) {
                    validStaffId = firstProfile.id
                } else {
                    const defaultProfile = await tx.profile.create({
                        data: {
                            fullName: "Cajero Principal",
                            email: "caja.principal@pokidopark.com",
                            role: "CASHIER",
                        },
                    })
                    validStaffId = defaultProfile.id
                }
            }

            // 3. CREAR LA ORDEN CON CLIENTE VÁLIDO
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: validCustomerId,
                    staffId: validStaffId,
                    shiftId: cashShiftId,
                    subtotal: totalAmount,
                    total: totalAmount,
                    status: "COMPLETED",
                },
            })

            const createdTickets = []

            // 4. PROCESAR ÍTEMS
            for (const item of items) {
                let ticketType = await tx.ticketType.findFirst({
                    where: { durationMinutes: item.durationMinutes },
                })

                if (!ticketType) {
                    ticketType = await tx.ticketType.create({
                        data: {
                            name: `Pase ${item.durationMinutes} Minutos`,
                            durationMinutes: item.durationMinutes,
                            price: item.price,
                        },
                    })
                }

                let minor = await tx.minor.findFirst({
                    where: {
                        customerId: validCustomerId,
                        fullName: item.minorName.replace(" (RECARGO EXCESO DE TIEMPO)", "").trim(),
                    },
                })

                if (!minor) {
                    const birthDate = new Date()
                    birthDate.setFullYear(birthDate.getFullYear() - item.minorAge)

                    minor = await tx.minor.create({
                        data: {
                            customerId: validCustomerId,
                            fullName: item.minorName,
                            birthDate,
                        },
                    })
                }

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        ticketTypeId: ticketType.id,
                        description: `Pase ${item.durationMinutes} Min - ${item.minorName}`,
                        quantity: 1,
                        unitPrice: item.price,
                        total: item.price,
                    },
                })

                const now = new Date()
                let startTime = new Date()

                if (item.entryTime && item.entryTime.includes(":")) {
                    const [hours, minutes] = item.entryTime.split(":").map(Number)
                    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0)
                }

                const endTime = new Date(startTime.getTime() + item.durationMinutes * 60000)

                const isOvertimePenalty = item.ticketTypeId === "OVERTIME-PENALTY"
                const ticketQrCode = isOvertimePenalty
                    ? `${item.wristbandCode}-REC-${Date.now().toString().slice(-4)}`
                    : (item.wristbandCode && item.wristbandCode !== "RECARGO" && item.wristbandCode !== "REC-EXCESO"
                        ? item.wristbandCode
                        : `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`)

                const ticket = await tx.ticket.create({
                    data: {
                        ticketTypeId: ticketType.id,
                        customerId: validCustomerId,
                        minorId: minor.id,
                        orderId: order.id,
                        qrCode: ticketQrCode,
                        price: item.price,
                        validDate: startTime,
                        startTime,
                        endTime,
                        status: isOvertimePenalty ? TicketStatus.USED : TicketStatus.ACTIVE,
                    },
                })

                // 5. SI ES UN RECARGO POR EXCESO DE TIEMPO:
                if (isOvertimePenalty) {
                    const originalTicket = await tx.ticket.findFirst({
                        where: {
                            OR: [
                                { qrCode: { equals: item.wristbandCode, mode: "insensitive" } },
                                { wristband: { code: { equals: item.wristbandCode, mode: "insensitive" } } },
                            ],
                            status: TicketStatus.ACTIVE,
                        },
                    })

                    if (originalTicket) {
                        await tx.ticket.update({
                            where: { id: originalTicket.id },
                            data: {
                                status: TicketStatus.USED, // Cambia el estado a USED para sacarlo de la pista
                            },
                        })
                    }

                    if (item.wristbandCode && item.wristbandCode !== "RECARGO") {
                        const existingWristband = await tx.wristband.findUnique({
                            where: { code: item.wristbandCode },
                        })
                        if (existingWristband) {
                            await tx.wristband.update({
                                where: { code: item.wristbandCode },
                                data: {
                                    status: WristbandStatus.AVAILABLE,
                                    returnedAt: now,
                                },
                            })
                        }
                    }
                }

                // Si es compra normal, asociamos la pulsera
                if (!isOvertimePenalty && item.wristbandCode && item.wristbandCode !== "RECARGO" && item.wristbandCode !== "REC-EXCESO") {
                    await tx.wristband.upsert({
                        where: { code: item.wristbandCode },
                        update: {
                            ticketId: ticket.id,
                            status: WristbandStatus.IN_PARK,
                            assignedAt: now,
                        },
                        create: {
                            code: item.wristbandCode,
                            color: "Estándar",
                            ticketId: ticket.id,
                            status: WristbandStatus.IN_PARK,
                            assignedAt: now,
                        },
                    })
                }

                // 🔑 Guardamos los datos para estructurar el recibo post-venta (Sanitizando Decimales a Number)
                createdTickets.push({
                    id: ticket.id,
                    qrCode: ticket.qrCode,
                    price: Number(ticket.price),
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    minorName: minor.fullName,
                    durationMinutes: item.durationMinutes,
                    wristbandCode: item.wristbandCode,
                })
            }

            // 5. REGISTRAR PAGO
            await tx.payment.create({
                data: {
                    orderId: order.id,
                    shiftId: cashShiftId,
                    amount: totalAmount,
                    method: paymentMethod,
                    status: "APPROVED",
                },
            })

            return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                total: Number(order.total),
                createdAt: order.createdAt,
                customerName: customerData?.fullName || "Cliente Mostrador",
                customerDni: customerData?.dni || "S/D",
                paymentMethod,
                tickets: createdTickets,
            }
        })

        revalidatePath("/dashboard/access")
        revalidatePath("/dashboard")
        revalidatePath("/dashboard/history")

        return {
            success: true,
            receiptData: result,
        }
    } catch (error: any) {
        console.error("Error al procesar venta POS:", error)
        return { success: false, error: error.message || "Error al procesar la venta." }
    }
}

export async function getRecentOrders(limit: number = 10) {
    try {
        const orders = await prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                customer: true,
                payments: true,
                tickets: {
                    include: {
                        minor: true,
                        ticketType: true,
                    },
                },
            },
        })

        const formattedOrders = orders.map((o) => ({
            orderId: o.id,
            orderNumber: o.orderNumber || `ORD-${o.id.slice(-4)}`,
            total: Number(o.total),
            paymentMethod: o.payments[0]?.method || "EFECTIVO",
            createdAt: o.createdAt.toISOString(),
            customerName: o.customer?.fullName || "Cliente Mostrador",
            customerDni: o.customer?.dni || "S/D",
            tickets: o.tickets.map((t) => ({
                id: t.id,
                qrCode: t.qrCode,
                price: Number(t.price),
                startTime: t.startTime ? t.startTime.toISOString() : new Date().toISOString(),
                endTime: t.endTime ? t.endTime.toISOString() : new Date().toISOString(),
                minorName: t.minor?.fullName || "Niño sin nombre",
                durationMinutes: t.ticketType?.durationMinutes || 60,
                wristbandCode: t.qrCode,
            })),
        }))

        return { success: true, orders: formattedOrders }
    } catch (error: any) {
        console.error("Error al obtener ordenes recientes:", error)
        return { success: false, orders: [], error: error.message }
    }
}

export async function findTicketByWristbandCode(wristbandCode: string) {
    try {
        if (!wristbandCode) return { success: false, error: "Código de pulsera no ingresado" }

        // Buscamos el ticket activo o consumido vinculado al código
        const ticket = await prisma.ticket.findFirst({
            where: {
                OR: [
                    { qrCode: { equals: wristbandCode, mode: "insensitive" } },
                    { wristband: { code: { equals: wristbandCode, mode: "insensitive" } } },
                ],
            },
            include: {
                customer: true,
                minor: true,
                ticketType: true,
            },
            orderBy: { createdAt: "desc" },
        })

        if (!ticket) {
            return { success: false, error: "No existe ninguna pulsera registrada con este código." }
        }

        const now = new Date()
        const endTime = ticket.endTime ? new Date(ticket.endTime) : now

        // Calculamos los minutos de exceso
        const diffMs = now.getTime() - endTime.getTime()
        const overtimeMinutes = Math.max(0, Math.ceil(diffMs / 60000))

        // Regla de cálculo del recargo (ej: $2.000 cada 15 min o tarifa fija por exceso)
        // Puedes adaptar esta tarifa según el tarifario del parque
        const ratePer15Min = 2500
        const periods = Math.max(1, Math.ceil(overtimeMinutes / 15))
        const penaltyFee = overtimeMinutes > 0 ? periods * ratePer15Min : 3000 // Tarifa base mínima

        return {
            success: true,
            ticket: {
                ticketId: ticket.id,
                customerId: ticket.customerId,
                customerName: ticket.customer?.fullName || "Cliente Registrado",
                customerDni: ticket.customer?.dni || "S/D",
                minorId: ticket.minorId,
                minorName: ticket.minor?.fullName || "Menor",
                wristbandCode: ticket.qrCode,
                overtimeMinutes: overtimeMinutes > 0 ? overtimeMinutes : 15,
                penaltyFee,
            },
        }
    } catch (error: any) {
        console.error("Error al buscar ticket por pulsera:", error)
        return { success: false, error: error.message }
    }
}