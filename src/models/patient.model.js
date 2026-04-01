import mongoose from "mongoose";
const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },
    bloodType: {
      type: String,
      enum: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Patient", patientSchema);
