import 'dotenv/config';
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import positionRoutes from './routes/positionRoutes.js';
// Import Routes
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
// import eventRoutes from './routes/eventRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import userRoutes from './routes/userRoutes.js';
// import eventTypeRoutes from './routes/eventTypeRoutes.js'
import googleRoutes from './routes/googleRoutes.js';
// Connect to Database
await connectDB();

import cronService from './services/cron.js'; // Initialize cron jobs
const app = express();

// CORS Configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use('/api/positions', positionRoutes); // ✅ เพิ่มบรรทัดนี้
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
// app.use('/api/events', eventRoutes);
// app.use('/api/event-types', eventTypeRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/google', googleRoutes);

// ... ส่วนที่เหลือเหมือนเดิม
// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Employee Leave Management API',
        version: '1.0.0'
    });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start Server - เก็บ instance ไว้ใน variable
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
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