require('dotenv').config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// --- ENDPOINTS ---

// Health Check (Public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// LOGIN (Public)
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                availability: {
                    include: { slots: true }
                }
            }
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Generate Token
            const token = jwt.sign(
                { id: user.id, role: user.role, email: user.email },
                SECRET_KEY,
                { expiresIn: '8h' }
            );

            // Return user info (exclude password)
            return res.json({
                token,
                role: user.role,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    availability: user.availability.map(avail => ({
                        day: avail.day,
                        observations: avail.observations || '',
                        slots: avail.slots.map(slot => ({
                            id: slot.id,
                            startTime: slot.startTime,
                            endTime: slot.endTime
                        }))
                    }))
                }
            });
        }

        return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET all docentes (Protected)
app.get('/api/docentes', authenticateToken, async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'docente' },
            include: {
                availability: {
                    include: { slots: true }
                }
            }
        });

        const formattedDocentes = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            availability: user.availability.map(avail => ({
                day: avail.day,
                observations: avail.observations || '',
                slots: avail.slots.map(slot => ({
                    id: slot.id,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                }))
            }))
        }));

        res.json(formattedDocentes);
    } catch (error) {
        console.error('Error fetching docentes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST update disponibilidad (Protected)
app.post('/api/docentes/:id/disponibilidad', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { availability } = req.body;

    // Authorization Check: Only Programador or the Docente themselves can update
    const authReq = req as AuthRequest;
    if (authReq.user?.role !== 'programador' && authReq.user?.id !== id) {
        return res.status(403).json({ error: 'Unauthorized to modify this user' });
    }

    if (!availability || !Array.isArray(availability)) {
        return res.status(400).json({ error: 'Availability data (array) is required' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.availability.deleteMany({ where: { userId: id } });
            for (const dayAvail of availability) {
                await tx.availability.create({
                    data: {
                        userId: id,
                        day: dayAvail.day,
                        observations: dayAvail.observations,
                        slots: {
                            create: dayAvail.slots.map((s: any) => ({
                                startTime: s.startTime,
                                endTime: s.endTime
                            }))
                        }
                    }
                });
            }
        });

        res.json({ message: 'Availability updated successfully' });

    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
