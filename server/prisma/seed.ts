import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DOCENTE_NAMES = [
    "VILLAVERDE ESPINOZA, EVILUZ",
    "VILCA SALAZAR, ENRIQUE JOSÉ",
    "SINTI RAMÍREZ, JORGE ENRIQUE",
    "APAGUEÑO ASPAJO, BORIS",
    "BREÑA MOZOMBITE, CARLOS ALBERTO",
    "CORNELIO CHUJUTALLI, MIGUEL ÁNGEL",
    "RÍOS GARCÍA, JUAN DIEGO",
    "ARÉVALO PANDURO, SILVIA DEL CARMEN",
    "RAMÍREZ PAREDES, ROSARIO ADILIA",
    "TAMANI MARICAHUA, JERDI",
    "SUÁREZ REÁTEGUI, SHIRLEY KESSLENA",
    "SALAZAR MACO, EDGAR HERNÁN",
    "MOGOLLÓN MAESTRE, GUILLERMO ENRIQUE",
    "ROBALINO TRAUCO, MARÍA DEL PILAR",
    "MORI DA SILVA, LUZ AYDEE",
    "GÓMEZ SÁNCHEZ, JORGE LUIS",
    "CORAL MENDOZA, GALY",
    "ZEGARRA LIAO, MARÍA MAGDALENA",
    "FLORES FLORES, LUIS FERNANDO",
    "ROMERO FLORES, EBERSON",
    "BABILONIA CHUQUIZUTA, JULIZA MILAGROS",
    "MILLONES ÁNGELES, CÉSAR AGUSTO",
    "VILLACORTA MONZÓN, PIERO PABLO",
    "LÓPEZ ALBIÑO, RICHARD ALEX",
    "GARCÍA VÁSQUEZ, ÁLVARO ANTONIO",
    "FLORES INUMA, ERICKA",
    "VALDEZ MARROU, ÁLEX ANTONIO",
    "HEREDIA ESCOBEDO, GREGORIO EDGARDO",
    "MONTENEGRO VALLES, OLGA VIRGINIA",
    "PÉREZ RUIZ, RICARDO",
    "SÁNCHEZ BABILONIA, JULIANA",
    "PINEDO LOZANO, JEAN PAUL",
    "RENGIFO LÓPEZ, SARHINAA CATHYUSKA",
    "TAFUR VEINTEMILLA, GEORGE DANIEL",
    "MENDOZA ARRAGUI, NANCY TERESA",
    "VIDAL TARICUARIMA, ERICK",
    "LOZANO URREA, SCARLETT OLIVIA",
    "MELÉNDEZ RAMÍREZ, ERNESTO EDIN",
    "VÁSQUEZ ELESPURU, MARLY",
    "URBINA PINEDO, KAREM JOSEFINA",
    "YALTA MORI, LUZ ADRIANA",
    "CONTRERAS SANDOVAL, ÁXEL LUIS",
    "HERNÁNDEZ RÍOS, MICHAEL",
    "RODRÍGUEZ VEINTEMILLA, DINA DEL CARMEN",
    "RAMÍREZ PINEDO, BELIT ASTRID",
    "ATIÁS VÁSQUEZ, GLADIS SUSANA",
    "NOGUEIRA GUERRA, ROY JEHRSON",
    "SOLIS COLLANTES, DASHIA LUSHIANA"
];

const COORDINATORS = [
    "MORI DA SILVA, LUZ AYDEE",
    "SINTI RAMÍREZ, JORGE ENRIQUE",
    "BABILONIA CHUQUIZUTA, JULIZA MILAGROS",
    "SOLIS COLLANTES, DASHIA LUSHIANA"
];

const SUPER_ADMINS = [
    "NUÑEZ ARANA, CLAUDIA ELIZABETH",
    "RENGIFO GUTIERREZ, MARLON MOISES"
];

// Helper to normalize text (remove accents)
function normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Helper to generate email from "SURNAME, FIRSTNAME"
function generateEmail(fullName: string, prefix = ''): string {
    if (!fullName) return `unknown.${Date.now()}@utp.edu.pe`;

    const normalized = normalizeText(fullName.toLowerCase());
    const parts = normalized.split(', ');

    let firstName = 'usuario';
    let firstSurname = 'nuevo';

    if (parts.length >= 2) {
        // Format: "SUVNAME, GIVEN NAMES"
        // surnames = parts[0], names = parts[1]
        const surnames = parts[0].trim().split(/\s+/);
        const names = parts[1].trim().split(/\s+/);
        firstName = names[0];
        firstSurname = surnames[0];
    } else {
        // Fallback if not comma separated: Assume "Name Surname" or "Surname Name"?
        // The provided list is consistently "SURNAME, NAME".
        // If fails, use entire string
        const tokens = normalized.split(/\s+/);
        firstName = tokens[0] || 'usuario';
        firstSurname = tokens[1] || 'utp';
    }

    return `${prefix}${firstName}.${firstSurname}@utp.edu.pe`;
}

// Helper to format Proper Name (Title Case)
function formatName(fullName: string): string {
    const parts = fullName.split(', ');
    if (parts.length < 2) return fullName;

    const toTitleCase = (str: string) => str.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    const surnames = toTitleCase(parts[0]);
    const names = toTitleCase(parts[1]);

    return `${names} ${surnames}`; // Display as "Name Surname"
}

async function main() {
    console.log('Start seeding ...');

    // Clear existing data
    try {
        await prisma.availability.deleteMany({});
        await prisma.user.deleteMany({});
    } catch (e) {
        console.log('Error clearing data (tables might be empty):', e);
    }

    const password = await bcrypt.hash('Utp2026!', 10);
    const adminPassword = await bcrypt.hash('Utp2026!', 10);

    // 1. Create Docentes
    for (const rawName of DOCENTE_NAMES) {
        if (!rawName.trim()) continue;
        const email = generateEmail(rawName);
        const name = formatName(rawName);

        console.log(`Creating Docente: ${name} (${email})`);

        await prisma.user.create({
            data: {
                name,
                email,
                role: 'docente',
                password,
                availability: {
                    create: [] // Empty availability
                }
            },
        });
    }

    // 2. Create Coordinators (Admin Access)
    for (const rawName of COORDINATORS) {
        // Generate admin email (with prefix to avoid conflict)
        const email = generateEmail(rawName, 'admin.');
        const name = formatName(rawName);

        console.log(`Creating Admin (Coordinator): ${name} (${email})`);

        await prisma.user.create({
            data: {
                name: `${name} (Coord)`,
                email,
                role: 'programador',
                password: adminPassword,
                availability: { create: [] }
            }
        });
    }

    // 3. Create Super Admins
    for (const rawName of SUPER_ADMINS) {
        const superEmail = generateEmail(rawName);
        const superName = formatName(rawName);
        console.log(`Creating Super Admin: ${superName} (${superEmail})`);

        // Check if duplicate
        const existing = await prisma.user.findUnique({ where: { email: superEmail } });
        if (!existing) {
            await prisma.user.create({
                data: {
                    name: `${superName} (Super Admin)`,
                    email: superEmail,
                    role: 'programador',
                    password: adminPassword,
                    availability: { create: [] }
                }
            });
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
