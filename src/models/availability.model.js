import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
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
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ doctorId: 1, startDateTime: 1 });
availabilitySchema.index(
  { doctorId: 1, startDateTime: 1, endDateTime: 1 },
  { unique: true }
);

export default mongoose.model("Availability", availabilitySchema);
