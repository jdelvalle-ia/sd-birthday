const { getBirthdays } = require('./src/services/db');

async function testConnection() {
    try {
        console.log('--- Probando conexión con MySQL ---');
        const rows = await getBirthdays();
        console.log(`Conexión exitosa. Se encontraron ${rows.length} registros.`);
        if (rows.length > 0) {
            console.log('Muestra del primer registro:', rows[0]);
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
    }
}

testConnection();
