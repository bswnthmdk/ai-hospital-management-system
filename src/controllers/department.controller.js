import Department from "../models/department.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
};
