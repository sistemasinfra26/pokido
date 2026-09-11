import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendTicketEmail(toEmail: string, orderNumber: string, customerName: string) {
    if (!process.env.SMTP_USER) {
        console.warn("[Email] No hay credenciales SMTP configuradas. Correo no enviado.")
        return
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderNumber}`

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #ffffff; padding: 30px; border-radius: 20px; max-w: 500px; margin: 0 auto;">
        <h1 style="color: #06b6d4; text-align: center; font-size: 28px; margin-bottom: 5px;">POKIDDO PARK</h1>
        <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-top: 0;">¡Tu reserva está lista!</p>
        
        <div style="background-color: #1e293b; padding: 20px; border-radius: 15px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Tutor:</strong> ${customerName}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Número de Orden:</strong> <span style="color: #06b6d4; font-weight: bold;">${orderNumber}</span></p>
        </div>

        <div style="text-align: center; background-color: #ffffff; padding: 20px; border-radius: 15px; display: inline-block; width: 100%; box-sizing: border-box;">
            <img src="${qrUrl}" alt="Código QR Entrada" style="width: 200px; height: 200px; margin: 0 auto; display: block;" />
            <p style="color: #0f172a; font-weight: bold; font-size: 12px; margin-top: 10px;">PRESENTA ESTE QR EN MUESTRA DE RECEPCIÓN</p>
        </div>

        <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 25px;">
            Muestra este código al llegar a la caja para canjear tus pulseras físicas y acceder a la pista.
        </p>
    </div>
    `

    try {
        await transporter.sendMail({
            from: `"Pokiddo Park" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `🎟️ Tus Entradas para Pokiddo Park - Orden #${orderNumber}`,
            html: htmlContent,
        })
        console.log(`[Email] Correo con QR enviado exitosamente a ${toEmail}`)
    } catch (error) {
        console.error("[Email Error]:", error)
    }
}