import mongoose from "mongoose";

import Availability from "../models/availability.model.js";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";
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
      startDateTime: { $lte: requestedTime }, // existing startDateTime <= requested time
      endDateTime: { $gt: requestedTime }, // existing endDateTime > requested time
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
      .json(new ApiResponse(appointment, "Appointment booked successfully"));
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

const getAvailableSlots = async (req, res, next) => {
  try {
    /**
     *  If User._id is used, we need to join for each query as both the 'Appointment' & 'Availability' use Doctor's document ObjectId
     *  doctorId = Doctor._id (MongoDB’s own ObjectId for the Doctor document)
     */
    const { doctorId, date } = req.query; // date = YYYY-MM-DD

    // 1. Validate inputs
    if (!doctorId || !date) {
      throw new ApiError(400, "doctorId and date are required");
    }

    // 2. Validate doctor existence and status
    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor not found or inactive");
    }

    // 3. Create day range from date
    const dayStart = new Date(`${date}T00:00:00.000Z`); // YYYY-MM-DDT00:00:00.000Z
    const dayEnd = new Date(`${date}T23:59:59.999Z`); // YYYY-MM-DDT23:59:59.999Z

    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
      throw new ApiError(400, "Invalid date format");
    }

    // 4. Fetch all active availability windows overlapping this day
    const availabilities = await Availability.find({
      doctorId,
      isActive: true,
      startDateTime: { $lt: dayEnd },
      endDateTime: { $gt: dayStart },
    }).sort({
      startDateTime: 1,
    });

    if (availabilities.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse([], "No availability for this day")); // As there are no avaiable window on that day, returning an empty arr as empty slot
    }

    // 5. Fetch all BOOKED appointments for that day (once)
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDateTime: { $gte: dayStart, $lte: dayEnd },
      status: "BOOKED",
    }).select("appointmentDateTime");
    // 'bookedAppointments' is an arr containing all booked appointment's starting dateTime

    // Create a Set of booked slot start times for quick lookup
    const bookedSlotsStartTime = new Set(
      bookedAppointments.map((appt) => appt.appointmentDateTime.getTime())
    );

    // 6. Generate slots in memory
    const slots = [];

    for (const availability of availabilities) {
      const slotDurationMs = availability.slotDuration * 60 * 1000; // convert slot duration mins to ms

      let slotStart = availability.startDateTime.getTime(); // probable 'slot start time' which is equal to the 'availability window start time' in ms. This is a variable as it will be incremented on each slot generation
      const availabilityEnd = availability.endDateTime.getTime(); // availability window end time in ms

      while (slotStart + slotDurationMs <= availabilityEnd) {
        // To avoid slots that overflow the availability window and can cause partial slots
        slots.push({
          startTime: new Date(slotStart),
          endTime: new Date(slotStart + slotDurationMs),
          status: bookedSlotsStartTime.has(slotStart) ? "BOOKED" : "OPEN", // Existance of slot in 'bookedSlotsStartTime' Set means its booked
        });

        slotStart += slotDurationMs; // Move to next slot start time
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(slots, "Available slots fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export { bookNewAppointment, cancelAppointment, getAvailableSlots };
