import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    appointmentDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // minutes
      default: 30,
      min: 15,
    },
    status: {
      type: String,
      enum: ["BOOKED", "COMPLETED", "CANCELLED"],
      default: "BOOKED",
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, appointmentDateTime: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ departmentId: 1 });

export default mongoose.model("Appointment", appointmentSchema);
