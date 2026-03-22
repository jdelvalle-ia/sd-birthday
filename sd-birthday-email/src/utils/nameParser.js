const PARTICLES = new Set(['da', 'de', 'del', 'la', 'las', 'los', 'mac', 'mc', 'van', 'von', 'y', 'i']);

function parseName(fullName) {
    if (!fullName) return { nombre: '', apellidos: '' };

    const words = fullName.trim().split(/\s+/);
    if (words.length <= 1) return { nombre: fullName, apellidos: '' };

    const blocks = [];
    for (let i = 0; i < words.length; i++) {
        let current = words[i];
        let lower = current.toLowerCase();
        
        if (PARTICLES.has(lower) && i + 1 < words.length) {
            let block = current;
            while (i + 1 < words.length && PARTICLES.has(words[i].toLowerCase())) {
                i++;
                block += ' ' + words[i];
            }
            blocks.push(block);
        } else {
            blocks.push(current);
        }
    }

    if (blocks.length >= 3) {
        const apellidos = blocks.slice(-2).join(' ');
        const nombre = blocks.slice(0, -2).join(' ');
        return { nombre, apellidos };
    } else if (blocks.length === 2) {
        return { nombre: blocks[0], apellidos: blocks[1] };
    }

    return { nombre: blocks[0], apellidos: '' };
}

module.exports = { parseName };
