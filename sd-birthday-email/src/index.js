require('dotenv').config();
const cron = require('node-cron');
const { getBirthdaysToday } = require('./services/db');
const { sendBirthdayEmail, sendDailyReport } = require('./services/email');
const { parseName } = require('./utils/nameParser');

async function runBirthdayAgent() {
    console.log(`[${new Date().toLocaleString()}] Iniciando proceso diario de cumpleaños...`);
    
    try {
        const birthdayPeople = await getBirthdaysToday();
        console.log(`Se han encontrado ${birthdayPeople.length} personas que cumplen años hoy.`);

        const reports = [];
        const isTestAdmin = process.argv.includes('--test-admin');
        const adminEmail = process.env.REPORT_EMAIL;

        if (isTestAdmin) {
            console.log(`[AVISO] Modo TEST ADMIN activo. Todos las felicitaciones se enviarán a: ${adminEmail}`);
        }

        for (const person of birthdayPeople) {
            const { nombre } = parseName(person.nombreyapellidos);
            
            // Choose template based on ambito
            let template = 'somdigitals';
            if (person.ambito === 'COIICV') template = 'coiicv';
            else if (person.ambito === 'COITICV') template = 'coiticv';

            const recipient = isTestAdmin ? adminEmail : person.email;
            const result = await sendBirthdayEmail(recipient, template, { nombre });
            
            reports.push({
                nombre: person.nombreyapellidos,
                ambito: person.ambito,
                status: result.success ? (result.simulated ? 'Simulado' : 'Enviado') : `Error: ${result.error}`
            });
        }

        // Send daily report
        await sendDailyReport(reports);
        
        // Log to Google Sheets
        const { logEmailProcess } = require('./services/sheets');
        const stats = {
            SOMDIGITALS: 0,
            COIICV: 0,
            COITICV: 0,
            Total: reports.length
        };

        reports.forEach(r => {
            if (r.ambito === 'SOMDIGITALS') stats.SOMDIGITALS++;
            else if (r.ambito === 'COIICV') stats.COIICV++;
            else if (r.ambito === 'COITICV') stats.COITICV++;
        });

        await logEmailProcess(stats);

        console.log(`[${new Date().toLocaleString()}] Proceso completado.`);
        
    } catch (error) {
        console.error('Error durante la ejecución del agente:', error.message);
    }
}

// Programar para las 10:00 todos los días
cron.schedule('0 10 * * *', () => {
    runBirthdayAgent();
});

// Opción manual para testeo
if (process.argv.includes('--manual')) {
    runBirthdayAgent();
}

console.log('Agente sd-birthday-email activo. Programado para las 10:00 AM todos los días.');
console.log('Modo prueba (DRY_RUN):', process.env.DRY_RUN);
