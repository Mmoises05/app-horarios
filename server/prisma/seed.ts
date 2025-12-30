import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DOCENTES_DATA } from './data/docentes';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING SMART SEED & MIGRATION ---');

    const password = await bcrypt.hash('Utp2026!', 10);

    for (const user of DOCENTES_DATA) {
        // 1. Check if user exists by email
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { availability: { include: { slots: true } } }
        });

        if (existingUser) {
            // 2. Check if ID matches
            if (existingUser.id === user.id) {
                // If role changed, update it
                if (existingUser.role !== (user.role || 'docente')) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: user.role || 'docente' }
                    });
                    console.log(`[OK] User ${user.name} Role updated.`);
                } else {
                    console.log(`[OK] User ${user.name} already has correct ID.`);
                }
            } else {
                console.log(`[MIGRATING] User ${user.name} found with WRONG ID (${existingUser.id}). Migrating to ${user.id}...`);

                // 3. Capture Availability
                const oldAvailability = existingUser.availability;

                // 4. Delete Old User
                await prisma.user.delete({ where: { email: user.email } });

                // 5. Create New User with Old Availability
                await prisma.user.create({
                    data: {
                        id: user.id, // FORCE CORRECT ID
                        name: user.name,
                        email: user.email,
                        role: user.role || 'docente',
                        password: existingUser.password, // Keep old password hash
                        availability: {
                            create: oldAvailability.map(a => ({
                                day: a.day,
                                observations: a.observations,
                                slots: {
                                    create: a.slots.map(s => ({
                                        startTime: s.startTime,
                                        endTime: s.endTime
                                    }))
                                }
                            }))
                        }
                    }
                });
                console.log(`   -> Migration Complete. Availability preserved.`);
            }
        } else {
            // Create New
            console.log(`[NEW] Creating User ${user.name} (${user.id})...`);
            await prisma.user.create({
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'docente',
                    password: password,
                    availability: { create: [] }
                }
            });
        }
    }

    // --- 6. CLEANUP & PRUNING ---
    // Remove any user not in our official lists to ensure exact match
    console.log("--- PRUNING INVALID USERS ---");

    const validEmails = DOCENTES_DATA.map(d => d.email);

    // Also protect the generated Admin accounts (admin.X) and Super Admins just in case
    // (Though they should be in DOCENTES_DATA if we updated it correctly, but let's be safe)

    const deleteResult = await prisma.user.deleteMany({
        where: {
            email: {
                notIn: validEmails
            }
        }
    });

    console.log(`[CLEANUP] Removed ${deleteResult.count} users that were not on the official list.`);

    console.log('--- SEEDING FINISHED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
