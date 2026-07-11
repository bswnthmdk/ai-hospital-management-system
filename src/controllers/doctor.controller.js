import Doctor from "../models/doctor.model.js";
import Department from "../models/department.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getAllDoctors = async (req, res, next) => {
  try {
    const {
      departmentId,
      isActive,
      specialization,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate("userId", "name email")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(filter),
    ]);

    console.log("Doctors fetched successfully");
    return res.status(200).json(
      new ApiResponse(
        {
          doctors,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
        "Doctors fetched successfully",
      ),
    );
  } catch (error) {
    console.log("Failed to fetch doctors");
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId)
      .populate("userId", "name email")
      .populate("departmentId", "name");

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    console.log("Doctor fetched successfully");
    return res
      .status(200)
      .json(new ApiResponse(doctor, "Doctor fetched successfully"));
  } catch (error) {
    console.log("Failed to fetch doctor");
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { departmentId, specialization, experienceYears } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department || !department.isActive) {
        throw new ApiError(404, "Department not found or inactive");
      }
      doctor.departmentId = departmentId;
    }

    if (specialization !== undefined) doctor.specialization = specialization;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;

    await doctor.save();

    console.log("Doctor updated successfully");
    return res
      .status(200)
      .json(new ApiResponse(doctor, "Doctor updated successfully"));
  } catch (error) {
    console.log("Failed to update doctor");
    next(error);
  }
};

const toggleDoctorStatus = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    console.log(
      `Doctor is ${doctor.isActive ? "activated" : "deactivated"} successfully`,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          doctor,
          `Doctor ${doctor.isActive ? "activated" : "deactivated"} successfully`,
        ),
      );
  } catch (error) {
    console.log("Failed to toggle doctor status");
    next(error);
  }
};

export { getAllDoctors, getDoctorById, updateDoctor, toggleDoctorStatus };
