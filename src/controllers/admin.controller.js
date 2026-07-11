import Department from "../models/department.model.js";
import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

/* -------------------- DEPARTMENT CRUD -------------------- */

const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new ApiError(400, "Department name is required");
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      throw new ApiError(409, "Department with this name already exists");
    }

    const department = await Department.create({
      name: name.trim(),
      description,
    });

    console.log("Department created successfully");
    return res.status(201).json(
      new ApiResponse(
        {
          department: {
            id: department._id,
            name: department.name,
            description: department.description,
            isActive: department.isActive,
          },
        },
        "Department created successfully",
      ),
    );
  } catch (error) {
    console.log("Failed to create department");
    next(error);
  }
};

const getAllDepartments = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    console.log("Departments fetched successfully");
    return res
      .status(200)
      .json(new ApiResponse(departments, "Departments fetched successfully"));
  } catch (error) {
    console.log("Failed to fetch departments");
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    console.log("Department fetched successfully");
    return res
      .status(200)
      .json(new ApiResponse(department, "Department fetched successfully"));
  } catch (error) {
    console.log("Failed to fetch department");
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { name, description } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    if (!department.isActive) {
      throw new ApiError(400, "Department is already inactive");
    }

    if (name !== undefined) department.name = name.trim();
    if (description !== undefined) department.description = description;

    await department.save();

    console.log("Department updated successfully");
    return res
      .status(200)
      .json(new ApiResponse(department, "Department updated successfully"));
  } catch (error) {
    console.log("Failed to update department");
    // Duplicate name on update
    if (error.code === 11000) {
      return next(new ApiError(409, "Department name already in use"));
    }
    next(error);
  }
};

const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }

    department.isActive = !department.isActive;
    await department.save();

    console.log(
      `${department.name} department is ${department.isActive ? "activated" : "deactivated"} successfully`,
    );

    return res.status(200).json(
      new ApiResponse(
        {
          department: {
            id: department._id,
            name: department.name,
            description: department.description,
            isActive: department.isActive,
          },
        },
        `Department ${
          department.isActive ? "activated" : "deactivated"
        } successfully`,
      ),
    );
  } catch (error) {
    console.log(
      `Failed to ${department.isActive ? "deactivate" : "activate"} ${department.name} department`,
    );
    next(error);
  }
};

/* -------------------- DOCTOR MANAGEMENT -------------------- */

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

const updateDoctorStatus = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be a boolean");
    }

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isActive },
      { new: true },
    );

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    console.log(
      `Doctor ${isActive ? "activated" : "deactivated"} successfully`,
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          doctor,
          `Doctor ${isActive ? "activated" : "deactivated"} successfully`,
        ),
      );
  } catch (error) {
    console.log("Failed to update doctor status");
    next(error);
  }
};

/* -------------------- PATIENT MANAGEMENT -------------------- */

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

/* -------------------- APPOINTMENT MONITORING -------------------- */

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

/* -------------------- DASHBOARD STATS -------------------- */

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      activeDoctors,
      totalDepartments,
      appointmentsByStatus,
      appointmentsByDepartment,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Doctor.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $group: { _id: "$departmentId", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: "$department" },
        {
          $project: {
            _id: 0,
            departmentId: "$_id",
            departmentName: "$department.name",
            count: 1,
          },
        },
      ]),
    ]);

    // Reshape [{_id: "BOOKED", count: 5}] into {BOOKED: 5, COMPLETED: 2, ...}
    const statusCounts = appointmentsByStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    console.log("Dashboard stats fetched successfully");
    return res.status(200).json(
      new ApiResponse(
        {
          totalPatients,
          totalDoctors,
          activeDoctors,
          totalDepartments,
          appointmentsByStatus: statusCounts,
          appointmentsByDepartment,
        },
        "Dashboard stats fetched successfully",
      ),
    );
  } catch (error) {
    console.log("Failed to fetch dashboard stats");
    next(error);
  }
};

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  getAllPatients,
  getPatientById,
  getAllAppointments,
  getDashboardStats,
};
