import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client"
import { sendTicketEmail } from "@/lib/email"

// Inicializar el SDK de Mercado Pago con tu Access Token privado
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
})

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // Mercado Pago envía el tipo de evento y el ID en query params o body
        const topic = searchParams.get("type") || searchParams.get("topic")
        const body = await request.json().catch(() => ({}))

        // Identificar el ID del pago notificado
        const paymentId = searchParams.get("data.id") || body?.data?.id || body?.id

        // Solo procesamos notificaciones de tipo "payment"
        if ((topic === "payment" || body?.type === "payment") && paymentId) {
            const paymentApi = new Payment(client)

            // 1. Obtener la información oficial del pago directamente desde la API de Mercado Pago
            const paymentInfo = await paymentApi.get({ id: paymentId })

            // 2. Extraer el external_reference que contiene el orderNumber de Pokiddo Park
            const orderNumber = paymentInfo.external_reference

            if (!orderNumber) {
                console.warn(`[MP Webhook] El pago ${paymentId} no tiene external_reference asociable a una orden.`)
                return NextResponse.json({ received: true }, { status: 200 })
            }

            // 3. Buscar la orden en nuestra base de datos e incluir los datos del cliente
            const order = await prisma.order.findUnique({
                where: { orderNumber },
                include: { customer: true },
            })

            if (!order) {
                console.error(`[MP Webhook] No se encontró la orden con orderNumber: ${orderNumber}`)
                return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
            }

            // 4. Si el pago fue APROBADO por Mercado Pago
            if (paymentInfo.status === "approved") {
                await prisma.$transaction([
                    // A. Actualizar estado de la orden a COMPLETED y guardar IDs de MP
                    prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: OrderStatus.COMPLETED,
                            mpPaymentId: String(paymentInfo.id),
                        },
                    }),

                    // B. Registrar el pago en la tabla Payment
                    prisma.payment.create({
                        data: {
                            orderId: order.id,
                            amount: paymentInfo.transaction_amount || order.total,
                            method: PaymentMethod.MERCADOPAGO,
                            status: PaymentStatus.APPROVED,
                            transactionRef: String(paymentInfo.id),
                        },
                    }),
                ])

                console.log(`[MP Webhook] Orden ${orderNumber} confirmada exitosamente.`)

                // C. Disparar envío de correo con los códigos QR al cliente
                if (order.customer?.email) {
                    await sendTicketEmail(
                        order.customer.email,
                        order.orderNumber,
                        order.customer.fullName
                    )
                }
            }
            // 5. Si el pago fue RECHAZADO o CANCELADO
            else if (paymentInfo.status === "rejected" || paymentInfo.status === "cancelled") {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: OrderStatus.CANCELLED,
                        mpPaymentId: String(paymentInfo.id),
                    },
                })
                console.log(`[MP Webhook] Orden ${orderNumber} fue ${paymentInfo.status}.`)
            }
        }

        // Responder con un status 200 OK a Mercado Pago para confirmar la recepción
        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: any) {
        console.error("[MP Webhook Error]:", error?.message || error)
        return NextResponse.json({ error: "Error procesando el webhook" }, { status: 500 })
    }
}