import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        (req as AuthRequest).user = user;
        next();
    });
};
