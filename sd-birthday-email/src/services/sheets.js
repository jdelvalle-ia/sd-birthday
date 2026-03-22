const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const creds = require('../../google-auth.json');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

async function logEmailProcess(stats) {
    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES,
    });

    if (!process.env.GOOGLE_SHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID no configurado en .env');
    }

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle['Log'];
    if (!sheet) {
        sheet = await doc.addSheet({ 
            title: 'Log', 
            headerValues: ['Fecha/Hora', 'SOMDIGITALS', 'COIICV', 'COITICV', 'Total', 'Tarea'] 
        });
    }

    // Always ensure headers are correct at the top
    await sheet.setHeaderRow(['Fecha/Hora', 'SOMDIGITALS', 'COIICV', 'COITICV', 'Total', 'Tarea']);

    const rows = await sheet.getRows();
    
    // Convert current rows to objects for easier manipulation
    const existingData = rows.map(r => r.toObject());

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`;
    
    const newData = {
        'Fecha/Hora': formattedDate,
        'SOMDIGITALS': stats.SOMDIGITALS || 0,
        'COIICV': stats.COIICV || 0,
        'COITICV': stats.COITICV || 0,
        'Total': stats.Total || 0,
        'Tarea': 'Envío de felicitaciones'
    };

    // Combine: New entries first (descending order)
    let nextData = [newData, ...existingData];

    // Filter out rows older than 14 months
    const fourteenMonthsAgo = new Date();
    fourteenMonthsAgo.setMonth(fourteenMonthsAgo.getMonth() - 14);

    nextData = nextData.filter(row => {
        const dateStr = row['Fecha/Hora'];
        if (!dateStr) return false;

        try {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('/').map(Number);
            const [hour, minute, second] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];
            
            const rowDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
            return rowDate >= fourteenMonthsAgo;
        } catch (e) {
            return true; // Keep if can't parse
        }
    });

    // Limit and write back
    const finalData = nextData.slice(0, 1000);

    // To ensure order, we clear and re-add
    await sheet.clearRows();
    if (finalData.length > 0) {
        await sheet.addRows(finalData);
    }

    console.log(`Log actualizado: ${formattedDate} - Total: ${stats.Total}`);
    console.log(`Orden: Nueva entrada añadida al principio. Total entradas: ${finalData.length}`);
}

module.exports = {
    logEmailProcess,
};
