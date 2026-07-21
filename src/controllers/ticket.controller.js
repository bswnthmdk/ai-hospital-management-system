import Ticket from "../models/ticket.model.js";
import Patient from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { inngest } from "../inngest/client.js";

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

    // 4. Trigger the Inngest function to process the ticket asynchronously
    await inngest.send({
      name: "ticket/created", //  Name of the event
      data: { ticketId: ticket._id.toString() }, //  Payload - the info that the event needs to carry along with it.
      /*
       * Here the event function (processTicket) doesn't automatically know which ticket triggered it — so the ticketId need to pass inside data specifically so the function can look up the right ticket.
       */
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
