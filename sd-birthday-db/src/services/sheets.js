const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { parseName } = require('../utils/nameParser');
require('dotenv').config();

// Placeholder for credentials
const creds = require('../../google-auth.json');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

async function updateBirthdaySheet(data) {
    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES,
    });

    let doc;
    if (!process.env.GOOGLE_SHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID no configurado en .env. Por favor, crea una hoja manualmente y añade su ID al archivo .env');
    }

    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);
    await doc.loadInfo();
    console.log(`Conectado a la hoja: ${doc.title}`);

    // Asegurarse de que la hoja 'SDcumpleaños' existe
    let sheet = doc.sheetsByTitle['SDcumpleaños'];
    if (!sheet) {
        sheet = await doc.addSheet({ 
            title: 'SDcumpleaños', 
            headerValues: ['documentacion', 'nombreyapellidos', 'nombre', 'apellidos', 'fecha_nacimiento', 'fechacumpleaños', 'diasemana', 'email', 'ambito'] 
        });
    } else {
        await sheet.clearRows();
        // Aseguramos que los encabezados estén actualizados si la hoja ya existía
        await sheet.setHeaderRow(['documentacion', 'nombreyapellidos', 'nombre', 'apellidos', 'fecha_nacimiento', 'fechacumpleaños', 'diasemana', 'email', 'ambito']);
    }

    // Formatear datos y calcular nuevas columnas
    const currentYear = new Date().getFullYear();
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    const formattedData = data.map(item => {
        const birthDate = item.fecha_nacimiento ? new Date(item.fecha_nacimiento) : null;
        let fechacumpleaños = '';
        let diasemana = '';
        
        if (birthDate) {
            let day = birthDate.getDate();
            let month = birthDate.getMonth();
            
            // Manejo de años bisiestos (29 Feb -> 28 Feb en años no bisiestos)
            if (month === 1 && day === 29 && !isLeap(currentYear)) {
                day = 28;
            }
            
            const bdayThisYear = new Date(currentYear, month, day);
            fechacumpleaños = bdayThisYear.toLocaleDateString('es-ES');
            diasemana = daysOfWeek[bdayThisYear.getDay()];
        }

        // Separar nombre y apellidos usando la utilidad mejorada
        const { nombre, apellidos } = parseName(item.nombreyapellidos);

        return {
            ...item,
            nombre,
            apellidos,
            fecha_nacimiento: birthDate ? birthDate.toLocaleDateString('es-ES') : '',
            fechacumpleaños,
            diasemana
        };
    });

    if (formattedData.length > 0) {
        await sheet.addRows(formattedData);
    }

    return { count: formattedData.length, spreadsheetId: doc.spreadsheetId };
}

async function logUpdate(count) {
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

    // Always ensure headers
    await sheet.setHeaderRow(['Fecha/Hora', 'SOMDIGITALS', 'COIICV', 'COITICV', 'Total', 'Tarea']);

    // Use raw data
    const rows = await sheet.getRows();
    const nextData = rows.map(r => r._rawData);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`;

    const newData = [
        formattedDate,
        '',
        '',
        '',
        count,
        'Actualización datos cumpleaños'
    ];

    nextData.unshift(newData);
    
    const MAX_LOG_ROWS = 1000;
    const finalData = nextData.slice(0, MAX_LOG_ROWS);

    await sheet.clearRows();
    await sheet.addRows(finalData);

    console.log(`Log de actualización guardado: ${formattedDate} - Total: ${count}`);
}

module.exports = {
    updateBirthdaySheet,
    logUpdate,
};
