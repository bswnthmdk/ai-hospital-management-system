import Ticket from "../models/ticket.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
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
const answerTicketQuestions = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { answers } = req.body; // expects: ["YES", "NO"] in the same order as stored questions

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      throw new ApiError(404, "Patient profile not found");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (ticket.patientId.toString() !== patient._id.toString()) {
      throw new ApiError(403, "You do not have access to this ticket");
    }

    if (
      !Array.isArray(answers) ||
      answers.length !== ticket.clarifyingQA.length
    ) {
      throw new ApiError(
        400,
        "Answers must match the number of questions asked",
      );
    }

    if (!answers.every((a) => a === "YES" || a === "NO")) {
      throw new ApiError(400, "Each answer must be YES or NO");
    }

    // Fill in the answers, preserving question order
    ticket.clarifyingQA = ticket.clarifyingQA.map((qa, i) => ({
      question: qa.question,
      answer: answers[i],
    }));
    await ticket.save();

    // Wake up the paused Inngest function
    await inngest.send({
      name: "ticket/questions-answered",
      data: { ticketId: ticket._id.toString() },
    });

    console.log("Ticket questions answered successfully");
    return res
      .status(200)
      .json(new ApiResponse(ticket, "Answers submitted successfully"));
  } catch (error) {
    console.log("Failed to answer ticket questions");
    next(error);
  }
};
const getTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      throw new ApiError(404, "Patient profile not found");
    }

    const ticket = await Ticket.findById(ticketId).populate(
      "matchedDepartmentId",
      "name description",
    );

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (ticket.patientId.toString() !== patient._id.toString()) {
      throw new ApiError(403, "You do not have access to this ticket");
    }

    return res
      .status(200)
      .json(new ApiResponse(ticket, "Ticket fetched successfully"));
  } catch (error) {
    console.log("Failed to fetch ticket");
    next(error);
  }
};
const getDoctorsFromSuggestedDepartment = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      throw new ApiError(404, "Patient profile not found");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (ticket.patientId.toString() !== patient._id.toString()) {
      throw new ApiError(403, "You do not have access to this ticket");
    }

    if (ticket.status !== "PROCESSED") {
      throw new ApiError(
        400,
        `Ticket is not ready yet (status: ${ticket.status})`,
      );
    }

    const doctors = await Doctor.find({
      departmentId: ticket.matchedDepartmentId,
      isActive: true,
    })
      .populate("userId", "name email")
      .sort({ experienceYears: -1 }); // swap to rating once that field exists

    console.log("Doctors from suggested department fetched successfully");
    return res
      .status(200)
      .json(
        new ApiResponse(
          doctors,
          "Doctors from suggested department fetched successfully",
        ),
      );
  } catch (error) {
    console.log("Failed to fetch doctors from suggested department");
    next(error);
  }
};

export {
  createTicket,
  answerTicketQuestions,
  getTicketById,
  getDoctorsFromSuggestedDepartment,
};
