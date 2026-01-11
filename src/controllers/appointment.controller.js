import mongoose from "mongoose";
import Availability from "../models/availability.model.js";
import Appointment from "../models/appointment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const bookNewAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patientId = req.user._id; // The user who is booking an appointment is the patient (coming from verifyJWT)
    const { doctorId, departmentId, appointmentDateTime, reason } = req.body;

    if (!doctorId || !departmentId || !appointmentDateTime) {
      throw new ApiError(400, "Missing required fields");
    }

    const requestedTime = new Date(appointmentDateTime); // ISO string to Date object

    // Validate requested time
    if (isNaN(requestedTime.getTime())) {
      throw new ApiError(400, "Invalid appointmentDateTime");
    }

    // 1. Find availability window that covers the requested time
    const availability = await Availability.findOne({
      doctorId,
      isActive: true,
      startDateTime: { $lte: requestedTime },
      endDateTime: { $gt: requestedTime },
    }).session(session);

    if (!availability) {
      throw new ApiError(
        400,
        "Requested time is outside doctor's availability"
      );
    }

    // 2. Check if requested time aligns with slot boundaries
    const slotDurationMs = availability.slotDuration * 60 * 1000; // convert slot duration mins to ms
    const diffMs =
      requestedTime.getTime() - availability.startDateTime.getTime(); // diff bet availability window start time and requested time

    // mod == 0 means requested time is the start of a valid slot
    if (diffMs % slotDurationMs !== 0) {
      throw new ApiError(400, "Requested time is not a valid slot boundary");
    }

    // 3. Create appointment (DB unique index prevents double booking)
    const [appointment] = await Appointment.create(
      [
        {
          patientId,
          doctorId,
          departmentId,
          appointmentDateTime: requestedTime,
          reason,
          status: "BOOKED",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(201, appointment, "Appointment booked successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Duplicate key error = slot already booked
    if (error.code === 11000) {
      return next(
        new ApiError(409, "This slot is already booked. Choose another time.")
      );
    }

    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {};

const getAvailableSlots = async (req, res, next) => {};

export { bookNewAppointment, cancelAppointment, getAvailableSlots };
