const cron = require('node-cron');
const { getBirthdays } = require('./services/db');
const { updateBirthdaySheet } = require('./services/sheets');
const { sendSyncReport } = require('./services/email');
const { logResult } = require('./utils/logger');
require('dotenv').config();

async function runSync() {
    try {
        console.log('Iniciando proceso de sincronización de cumpleaños...');
        
        // 1. Obtener datos de MySQL
        const birthdays = await getBirthdays();
        console.log(`Datos obtenidos: ${birthdays.length} registros.`);

        // 2. Actualizar Google Sheets
        const result = await updateBirthdaySheet(birthdays);

        // 3. Informar resultado (Consola y Log)
        await logResult(result.count);
        
        // 4. Enviar reporte por email
        await sendSyncReport(result.count);

        if (!process.env.GOOGLE_SHEET_ID) {
            console.log(`URL del nuevo documento: https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`);
        }

    } catch (error) {
        console.error('Error durante el proceso de sincronización:', error.message);
    }
}

// Programar para el día 1 de cada mes a las 04:00
// Formato cron: minuto hora dia mes dia-semana
cron.schedule('0 4 1 * *', () => {
    console.log('Ejecutando sincronización programada (Día 1 del mes a las 04:00)...');
    runSync();
});

// También permitimos ejecución manual si se pasa un argumento --manual
if (process.argv.includes('--manual')) {
    runSync().then(() => {
        console.log('Ejecución manual por GitHub Actions completada. Cerrando proceso.');
        process.exit(0);
    });
}

console.log('Agente sd-birthday-db iniciado y programado.');
console.log('Programación: El día 1 de cada mes a las 04:00.');
console.log('Use "node src/index.js --manual" para ejecutar ahora.');
