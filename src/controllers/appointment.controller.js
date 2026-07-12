import mongoose from "mongoose";

import Availability from "../models/availability.model.js";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// TEMPORARY: assign a doctor without time-based scheduling.
// To be replaced once slot-based booking is finalized.
const assignDoctorTemporary = async (req, res, next) => {
  try {
    const { doctorId, description } = req.body;

    if (!doctorId) {
      throw new ApiError(400, "doctorId is required");
    }

    // 1. Resolve the logged-in user's Patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      throw new ApiError(404, "Patient profile not found");
    }

    // 2. Validate doctor and derive department from the doctor's own record
    const doctor = await Doctor.findOne({ _id: doctorId, isActive: true });
    if (!doctor) {
      throw new ApiError(404, "Doctor not found or inactive");
    }

    // 3. Create appointment (no real scheduling yet — placeholder timestamp)
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      departmentId: doctor.departmentId,
      appointmentDateTime: new Date(),
      appointmentDescription: description,
      status: "BOOKED",
    });

    console.log("Doctor assigned successfully");
    return res
      .status(201)
      .json(new ApiResponse(appointment, "Doctor assigned successfully"));
  } catch (error) {
    console.log("Failed to assign doctor");
    if (error.code === 11000) {
      return next(new ApiError(409, "Duplicate booking timestamp, try again"));
    }
    next(error);
  }
};

const bookNewAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patientId = req.user._id; // The user who is booking an appointment is the patient (coming from verifyJWT)
    const { doctorId, departmentId, appointmentDateTime, description } =
      req.body;

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
        "Requested time is outside doctor's availability",
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
          appointmentDescription: description,
          status: "BOOKED",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    console.log("Appointment booked successfully");
    return res
      .status(201)
      .json(new ApiResponse(appointment, "Appointment booked successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log("Failed to book appointment");
    // Duplicate key error = slot already booked
    if (error.code === 11000) {
      return next(
        new ApiError(409, "This slot is already booked. Choose another time."),
      );
    }

    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId, cancelReason } = req.body;

    if (!appointmentId) {
      throw new ApiError(400, "appointmentId is required");
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.status === "CANCELLED") {
      throw new ApiError(400, "Appointment is already cancelled");
    }

    appointment.status = "CANCELLED";
    appointment.cancelledBy = req.user?.role || "SYSTEM";
    appointment.cancelledAt = new Date();
    if (cancelReason) appointment.cancelReason = cancelReason;

    await appointment.save();

    console.log("Appointment cancelled successfully");
    return res
      .status(200)
      .json(new ApiResponse(appointment, "Appointment cancelled successfully"));
  } catch (error) {
    console.log("Failed to cancel appointment");
    next(error);
  }
};

const getAllAppointments = async (req, res, next) => {
  try {
    const {
      status,
      doctorId,
      patientId,
      departmentId,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (departmentId) filter.departmentId = departmentId;

    if (fromDate || toDate) {
      filter.appointmentDateTime = {};
      if (fromDate) filter.appointmentDateTime.$gte = new Date(fromDate);
      if (toDate) filter.appointmentDateTime.$lte = new Date(toDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({
          path: "patientId",
          select: "userId phone",
          populate: { path: "userId", select: "name email" },
        })
        .populate({
          path: "doctorId",
          select: "userId specialization",
          populate: { path: "userId", select: "name email" },
        })
        .populate("departmentId", "name")
        .sort({ appointmentDateTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);

    console.log("Appointments fetched successfully");
    return res.status(200).json(
      new ApiResponse(
        {
          appointments,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        "Appointments fetched successfully",
      ),
    );
  } catch (error) {
    console.log("Failed to fetch appointments");
    next(error);
  }
};

export {
  assignDoctorTemporary,
  bookNewAppointment,
  cancelAppointment,
  getAllAppointments,
};
