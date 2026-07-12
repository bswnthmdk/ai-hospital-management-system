import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    appointmentDateTime: {
      type: Date,
      required: true,
    },
    appointmentDescription: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["BOOKED", "COMPLETED", "CANCELLED"],
      default: "BOOKED",
    },

    cancelledBy: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "SYSTEM"],
    },

    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
    },
  },
  { timestamps: true },
);

// HARD GUARANTEE: one doctor cannot have two appointments at the same time
appointmentSchema.index(
  { doctorId: 1, appointmentDateTime: 1 },
  { unique: true },
);

export default mongoose.model("Appointment", appointmentSchema);
