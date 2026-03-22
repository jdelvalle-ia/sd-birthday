const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

async function getBirthdaysToday() {
    const connection = await mysql.createConnection(config);
    try {
        const query = `
            SELECT documentacion, nombreyapellidos, fecha_nacimiento, email, ambito
            FROM ${process.env.DB_TABLE}
            WHERE 
                ((ambito = 'COIICV' AND estado_coiicv = 'activo') OR
                 (ambito = 'COITICV' AND estado_coiticv = 'activo') OR
                 (ambito = 'SOMDIGITALS' AND estado_somdigitals = 'activo'))
                AND DAY(fecha_nacimiento) = DAY(CURDATE())
                AND MONTH(fecha_nacimiento) = MONTH(CURDATE())
        `;
        
        const [rows] = await connection.execute(query);
        return rows;
    } finally {
        await connection.end();
    }
}

module.exports = {
    getBirthdaysToday,
};
