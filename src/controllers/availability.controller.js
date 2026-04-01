import Availability from "../models/availability.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createAvailability = async (req, res, next) => {
  try {
    const doctorId = req.user._id; // The user who is creating an availability is a doctor (coming from verifyJWT)
    const { startDateTime, endDateTime, slotDuration } = req.body;

    if (!startDateTime || !endDateTime) {
      throw new ApiError(400, "startDateTime and endDateTime are required");
    }

    // ISO string to Date object
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Validate times
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, "Invalid date format");
    }

    if (end <= start) {
      throw new ApiError(400, "endDateTime must be after startDateTime");
    }

    // 1. Check for overlapping availability
    const overlappingAvailability = await Availability.findOne({
      doctorId,
      isActive: true,
      startDateTime: { $lt: end }, // existing startDateTime < end of new availability
      endDateTime: { $gt: start }, // existing endDateTime > start of new availability
    });

    if (overlappingAvailability) {
      throw new ApiError(
        409,
        "Availability overlaps with an existing availability window"
      );
    }

    // 2. Create availability
    const availability = await Availability.create({
      doctorId,
      startDateTime: start,
      endDateTime: end,
      slotDuration: slotDuration || 30,
      isActive: true,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, availability, "Availability created successfully")
      );
  } catch (error) {
    next(error);
  }
};

export { createAvailability };
