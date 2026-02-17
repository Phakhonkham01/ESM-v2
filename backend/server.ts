//file name server.ts
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import positionRoutes from './routes/positionRoutes';
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import userRoutes from './routes/userRoutes';
import requestOTandFieldWorkRoutes from "./routes/requestOTandFieldWorkRoutes";
import dayOffRoutes from './routes/dayOffRequestRoutes';
import satSunRoutes from './routes/sat_sunRequestRoutes.js'; // ✅ เพิ่ม Saturday/Sunday routes
import salaryRoutes from "./routes/salaryRoutes.js";
import emailRoutes from './routes/emailRoutest.js';

// Connect to Database
await connectDB();

const app: Express = express();

// CORS Configuration
// app.use(
//     cors({
//         origin: [
//             process.env.CLIENT_URL!, // The '!' tells TS this won't be undefined
//             'http://localhost:5173',
//             'http://localhost:5174',
//             '0.0.0.0'
//         ],
//         methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//         credentials: true
//     })
// );
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/positions', positionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use("/api/requestOTandFieldWorkRoutes", requestOTandFieldWorkRoutes);
app.use('/api/day-off-requests', dayOffRoutes);
app.use('/api/sat-sun-requests', satSunRoutes); // ✅ เพิ่ม Saturday/Sunday endpoint
app.use("/api/salaries", salaryRoutes);
app.use('/api/salary', emailRoutes); // Email route: POST /api/salary/send-email

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root Route
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        message: 'Employee Leave Management API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            departments: '/api/departments',
            positions: '/api/positions',
            dayOffRequests: '/api/day-off-requests',
            satSunRequests: '/api/sat-sun-requests', // ✅ แสดงใน API documentation
            otAndFieldWork: '/api/requestOTandFieldWorkRoutes',
            salaries: '/api/salaries',
            health: '/api/health'
        }
    });
});

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Error Handling Middleware
interface CustomError extends Error {
    status?: number;
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`📅 Day Off Requests: http://localhost:${PORT}/api/day-off-requests`);
    console.log(`🗓️  Sat-Sun Requests: http://localhost:${PORT}/api/sat-sun-requests`); // ✅ แสดง endpoint ใหม่
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});