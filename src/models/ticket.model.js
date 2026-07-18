import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    // What the patient originally typed
    rawDescription: {
      type: String,
      required: true,
      trim: true,
    },

    // Gemini-corrected version (Step A)
    cleanedDescription: {
      type: String,
      trim: true,
    },

    // Gemini's extracted summary (Step B)
    summary: {
      type: String,
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    suggestedSpecialization: {
      type: String,
      trim: true,
    },

    // Doctor list shown to the patient (Step C)
    matchedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],

    // Doctor the patient actually picked
    selectedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // Once confirmed, link to the real Appointment
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "ASSIGNED", "FAILED"],
      default: "PENDING",
    },

    failureReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
