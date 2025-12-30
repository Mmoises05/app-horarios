import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
    "juliza.babilonia@utp.edu.pe",
    "luz.mori@utp.edu.pe",
    "jorge.sinti@utp.edu.pe",
    "dashia.solis@utp.edu.pe",
    "marlon.rengifo@utp.edu.pe",
    "claudia.nunez@utp.edu.pe"
];

async function main() {
    console.log("Checking Admin Roles...");
    const users = await prisma.user.findMany({
        where: {
            email: { in: ADMIN_EMAILS }
        }
    });

    users.forEach(u => {
        console.log(`User: ${u.email} | Role: ${u.role} | ID: ${u.id}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
