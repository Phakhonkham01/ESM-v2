import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Ensure the .js extension is here

export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id)
                .select('-password')
                .populate('department_id');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Middleware สำหรับ CEO เท่านั้น
export const ceo = (req, res, next) => {
    if (req.user && req.user.role === 'supervisor') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. CEO only.' });
    }
};

// Middleware สำหรับ admin หรือ CEO
export const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin or CEO only.' });
    }
};

// Middleware สำหรับ member, admin, หรือ CEO (ทุกคน)
export const member = (req, res, next) => {
    if (req.user && ['member', 'admin', 'supervisor'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied.' });
    }
};