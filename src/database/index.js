import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env from src/.env because the .env file lives in the src folder
dotenv.config({ path: "./src/.env" });

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("MONGODB_URI is not set in .env (checked ./src/.env)");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
