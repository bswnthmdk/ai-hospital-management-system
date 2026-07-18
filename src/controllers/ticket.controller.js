import Ticket from "../models/ticket.model.js";
import Patient from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const createTicket = async (req, res, next) => {
  try {
    const { rawDescription } = req.body;

    // 1. Basic validation
    if (!rawDescription || !rawDescription.trim()) {
      throw new ApiError(400, "Problem description is required");
    }

    // Minimum length check - avoid wasting an AI call on near-empty input later
    // if (rawDescription.trim().length < 15) {
    //   throw new ApiError(
    //     400,
    //     "Please describe your problem in a bit more detail",
    //   );
    // }

    // 2. Resolve the logged-in user's Patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      throw new ApiError(404, "Patient profile not found");
    }

    // 3. Create the ticket — status defaults to PENDING
    const ticket = await Ticket.create({
      patientId: patient._id,
      rawDescription: rawDescription.trim(),
    });

    console.log("Ticket created successfully");
    return res
      .status(201)
      .json(new ApiResponse(ticket, "Ticket created successfully"));
  } catch (error) {
    console.log("Failed to create ticket");
    next(error);
  }
};

export { createTicket };
