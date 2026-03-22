const { logUpdate } = require('../services/sheets');

async function logResult(count) {
    const now = new Date();
    const formattedDate = now.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    console.log(`\n-----------------------------------------`);
    console.log(`Proceso completado con éxito.`);
    console.log(`Fecha y hora: ${formattedDate}`);
    console.log(`Número de registros creados: ${count}`);
    console.log(`-----------------------------------------\n`);

    try {
        await logUpdate(count);
    } catch (error) {
        console.error('Error al guardar log en Google Sheets:', error.message);
    }
}

module.exports = {
    logResult,
};
