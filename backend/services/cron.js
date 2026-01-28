import cron from "node-cron";
import mongoose from "mongoose";
import User from "../models/User.js";

// cron.js
class CronService {
  constructor() {
    this.init();
  }

  init() {
    // รันทุกวันตอนเที่ยงคืน
    cron.schedule("0 0 * * *", async () => {
      console.log("🔄 Running daily cron job for holiday status updates...");
      await this.updateUserStatuses();
    });

    cron.schedule("0 * * * *", async () => {
      console.log("⏱ Cron job fired every 10 seconds!");
      await this.updateUserStatuses();
      await this.verifyUserStatuses();
    });

    // รันทุกชั่วโมงเพื่อตรวจสอบความถูกต้อง
    // cron.schedule("*/10 * * * * *", async () => {
    //   console.log("⏱ Cron job fired every 10 seconds!");
    //   await this.updateUserStatuses();
    //   await this.verifyUserStatuses();
    // });

    console.log("⏰ Cron jobs initialized");
  }

  async updateUserStatuses() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const leavesToday = await Holiday.find({
      holiday_type: "private",
      status: "approved",
      applied_to_leave_days: false, // ✅ เฉพาะที่ยังไม่ถูกใช้
      start_date: { $lte: tomorrow },
      end_date: { $gte: today },
    });

    const userIdsOnLeave = leavesToday.map((l) => l.user_id);

    // 1️⃣ set คนที่ลา
    await User.updateMany(
      { _id: { $in: userIdsOnLeave } },
      { $set: { status: "leave day" } }
    );

    // 2️⃣ reset คนที่ไม่ลา
    for (const leave of leavesToday) {
      await User.updateOne(
        { _id: leave.user_id },
        { $inc: { leave_days: -leave.total_days } } // ลบ leave_days
      );

      await Holiday.updateOne(
        { _id: leave._id },
        { $set: { applied_to_leave_days: true } } // ✅ ตั้ง flag ว่าใช้แล้ว
      );

      console.log(
        `➖ Deducted ${leave.total_days} days from user ${leave.user_id} leave_days`
      );
    }
  }

  async verifyUserStatuses() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log("🔍 verifyUserStatuses started");
      console.log("📅 Today:", today.toISOString());
      console.log("📅 Tomorrow:", tomorrow.toISOString());

      const usersOnLeave = await User.find({ status: "leave day" }).select(
        "_id user_email"
      );

      console.log(
        `👥 Users currently marked as leave day: ${usersOnLeave.length}`
      );

      if (usersOnLeave.length === 0) {
        console.log("✅ No users with leave day status, skipping verification");
        return;
      }

      for (const user of usersOnLeave) {
        const hasLeave = await Holiday.exists({
          user_id: user._id,
          holiday_type: "private", // ต้องตรงกับ updateUserStatuses
          status: "approved",
          start_date: { $lte: tomorrow },
          end_date: { $gte: today },
        });

        if (!hasLeave) {
          await User.updateOne(
            { _id: user._id },
            { $set: { status: "work day" } }
          );
          console.log(`🔄 Reset to work day: ${user.user_email}`);
        }
      }
    } catch (err) {
      console.error("❌ Error in verifyUserStatuses:", err);
    }
  }
}

// ส่งออก instance เดียวของ CronService
export default new CronService();
