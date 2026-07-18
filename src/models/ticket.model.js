import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    rawDescription: {
      type: String,
      required: true,
      trim: true,
    },

    redefinedDescription: {
      type: String,
      trim: true,
    },

    summary: {
      type: String,
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    // One round of yes/no clarifying questions, stored as question-answer pairs
    clarifyingQA: [
      {
        question: { type: String, required: true },
        answer: { type: String, enum: ["YES", "NO"], required: true },
      },
    ],

    confidence: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
    },

    matchedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "ASSIGNED", "FAILED"],
      default: "PENDING",
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
