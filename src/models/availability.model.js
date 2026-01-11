import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDateTime;
        },
        message: "endDateTime must be after startDateTime",
      },
    },

    slotDuration: {
      type: Number, // minutes
      required: true,
      default: 30, // default slot duration is 30 minutes
      min: 5, // minimum slot duration is 5 minutes
      max: 120, // maximum slot duration is 120 minutes
    },

    // Doctor can manually disable an availability window
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Helps fetch availability windows efficiently
availabilitySchema.index({ doctorId: 1, startDateTime: 1 });

export default mongoose.model("Availability", availabilitySchema);
