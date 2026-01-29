import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URL as string, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected Successfully");
        console.log(`📦 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
    } catch (err: any) {
        console.error("❌ Error connecting to MongoDB:", err.message);
        console.error("💡 Check: Network Access, Connection String, Password");
        process.exit(1);
    }
};

export default connectDB;