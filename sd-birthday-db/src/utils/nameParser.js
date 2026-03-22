/**
 * Utility to split full names into First Name and Surnames following Spanish conventions.
 * It groups particles like "de", "del", "la", etc., with the following word.
 */

const PARTICLES = new Set(['da', 'de', 'del', 'la', 'las', 'los', 'mac', 'mc', 'van', 'von', 'y', 'i']);

function parseName(fullName) {
    if (!fullName) return { nombre: '', apellidos: '' };

    const words = fullName.trim().split(/\s+/);
    if (words.length <= 1) return { nombre: fullName, apellidos: '' };

    // Group particles with next word
    const blocks = [];
    for (let i = 0; i < words.length; i++) {
        let current = words[i];
        let lower = current.toLowerCase();
        
        // If it's a particle, try to join it with the next word(s)
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

    // Heuristic: If we have 3 or more blocks, assume last 2 are surnames
    // Example: [Juan] [Pérez] [García] -> Juan | Pérez García
    // Example: [José Luis] [del Valle] [Fernández] -> José Luis | del Valle Fernández
    if (blocks.length >= 3) {
        const apellidos = blocks.slice(-2).join(' ');
        const nombre = blocks.slice(0, -2).join(' ');
        return { nombre, apellidos };
    } else if (blocks.length === 2) {
        // Standard split for 2 blocks
        return { nombre: blocks[0], apellidos: blocks[1] };
    }

    return { nombre: blocks[0], apellidos: '' };
}

module.exports = { parseName };
