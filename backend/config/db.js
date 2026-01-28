import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 30000, // เพิ่ม timeout
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected Successfully");
        console.log(`📦 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
    } catch (err) {
        console.error("❌ Error connecting to MongoDB:", err.message);
        console.error("💡 Check: Network Access, Connection String, Password");
        process.exit(1);
    }
}

// Change from module.exports to export default
export default connectDB;