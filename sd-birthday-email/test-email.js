require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('DEBUG: Host =', process.env.SMTP_HOST);
console.log('DEBUG: Port =', process.env.SMTP_PORT);
console.log('DEBUG: User =', process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    debug: true,
    logger: true
});

async function main() {
    try {
        console.log('Verificando conexión...');
        await transporter.verify();
        console.log('Conexión verificada con éxito.');
        
        console.log('Enviando correo de prueba...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.REPORT_EMAIL,
            subject: 'Prueba de sd-birthday-email',
            text: 'Este es un correo de prueba del agente sd-birthday-email.'
        });
        console.log('Correo enviado con éxito:', info.messageId);
    } catch (error) {
        console.error('ERROR DETALLADO:');
        console.error(error);
    }
}

main();
