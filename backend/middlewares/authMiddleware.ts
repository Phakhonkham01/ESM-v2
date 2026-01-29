import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// ================= Extended Request Interface =================

export interface AuthRequest extends Request {
    user?: IUser;
}

interface DecodedToken extends JwtPayload {
    id: string;
}

// ================= Middleware Functions =================

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
            return;
        }

        try {
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET as string
            ) as DecodedToken;

            const user = await User.findById(decoded.id)
                .select('-password')
                .populate('department_id');

            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Middleware สำหรับ CEO เท่านั้น
export const ceo = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user && req.user.role === 'CEO') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. CEO only.' });
    }
};

// Middleware สำหรับ admin หรือ CEO
export const admin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'CEO')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin or CEO only.' });
    }
};

// Middleware สำหรับ member, admin, หรือ CEO (ทุกคน)
export const member = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user && ['employee', 'admin', 'CEO', 'supervisor'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied.' });
    }
};