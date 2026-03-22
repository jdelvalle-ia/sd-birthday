require('dotenv').config();

async function getBirthdaysToday() {
    if (!process.env.API_URL) {
        throw new Error('API_URL no configurada en .env. Debe apuntar a tu archivo sd-birthday.php subido al servidor.');
    }

    const payload = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        name: process.env.DB_NAME,
        table: process.env.DB_TABLE,
        action: 'today'
    };

    const response = await fetch(process.env.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor PHP (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(`Error retornado por puente PHP: ${data.error}`);
    }

    return data;
}

module.exports = {
    getBirthdaysToday,
};
