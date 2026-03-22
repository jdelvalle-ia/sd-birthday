const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
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

async function sendBirthdayEmail(recipient, templateName, data) {
    const isDryRun = process.env.DRY_RUN === 'true';
    const transporter = getTransporter();
    
    // Load and compile template
    const templatePath = path.join(__dirname, '../../templates', `${templateName.toLowerCase()}.html`);
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    const html = template(data);

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: recipient,
        subject: '¡Feliz Cumpleaños!',
        html: html,
    };

    if (isDryRun) {
        console.log(`[DRY RUN] Simulación de envío de correo a: ${recipient} (${templateName})`);
        return { success: true, simulated: true };
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error enviando correo a ${recipient}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function sendDailyReport(summary) {
    const isDryRun = process.env.DRY_RUN === 'true';
    const recipient = process.env.REPORT_EMAIL;
    const transporter = getTransporter();

    let reportHtml = `<h2>Resumen de envíos de felicitaciones de hoy</h2>`;
    reportHtml += `<p>Total de registros procesados: ${summary.length}</p>`;
    reportHtml += `<table border="1" cellpadding="5" style="border-collapse: collapse;">
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Ámbito</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>`;

    summary.forEach(item => {
        reportHtml += `<tr>
            <td>${item.nombre}</td>
            <td>${item.ambito}</td>
            <td>${item.status}</td>
        </tr>`;
    });

    reportHtml += `</tbody></table>`;

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: recipient,
        subject: `Reporte diario de cumpleaños - ${new Date().toLocaleDateString('es-ES')}`,
        html: reportHtml,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reporte diario enviado con éxito a: ${recipient}`);
        return { success: true };
    } catch (error) {
        console.error(`Error enviando reporte a ${recipient}:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendBirthdayEmail,
    sendDailyReport,
};
