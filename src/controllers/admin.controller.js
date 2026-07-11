import Department from "../models/department.model.js";
import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

export { getDashboardStats };
