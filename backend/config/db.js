import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const ADMIN_HASH = "$2b$10$aULsUjp9bb9lf5CZZyY.7./KhwsocVO0duyPlqu0Qnte75xHBdG5C";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/EPMS");
    console.log("Database Connected Successfully");
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create({
        username: "admin",
        email: "admin@exam.local",
        password: ADMIN_HASH,
      });
    }
    return true;
  } catch (error) {
    console.log("Database Connection Failed");
    console.error(error.message);
    return false;
  }
};

export default mongoose;
