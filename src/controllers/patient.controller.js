import Patient from "../models/patient.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getAllPatients = async (req, res, next) => {
  try {
    const { gender, bloodType, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (gender) filter.gender = gender;
    if (bloodType) filter.bloodType = bloodType;

    const skip = (Number(page) - 1) * Number(limit);

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Patient.countDocuments(filter),
    ]);

    console.log("Patients fetched successfully");
    return res.status(200).json(
      new ApiResponse(
        {
          patients,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        "Patients fetched successfully",
      ),
    );
  } catch (error) {
    console.log("Failed to fetch patients");
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId).populate(
      "userId",
      "name email",
    );

    if (!patient) {
      throw new ApiError(404, "Patient not found");
    }

    console.log("Patient fetched successfully");
    return res
      .status(200)
      .json(new ApiResponse(patient, "Patient fetched successfully"));
  } catch (error) {
    console.log("Failed to fetch patient");
    next(error);
  }
};

export { getAllPatients, getPatientById };
