const nodemailer = require('nodemailer');
require('dotenv').config();

const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

async function sendSyncReport(count) {
    const recipient = process.env.REPORT_EMAIL;
    const transporter = getTransporter();
    const now = new Date();

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: recipient,
        subject: `Reporte de Sincronización SDcumpleaños - ${now.toLocaleDateString('es-ES')}`,
        html: `
            <h2>Resultado del proceso de sincronización</h2>
            <p>El proceso de actualización de la hoja <strong>SDcumpleaños</strong> se ha completado.</p>
            <ul>
                <li><strong>Fecha y hora:</strong> ${now.toLocaleString('es-ES')}</li>
                <li><strong>Registros creados/actualizados:</strong> ${count}</li>
            </ul>
            <p>Este es un reporte automático de <em>sd-birthday-db</em>.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reporte de sincronización enviado con éxito a: ${recipient}`);
        return { success: true };
    } catch (error) {
        console.error(`Error enviando reporte de sincronización a ${recipient}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendSyncReport,
};
