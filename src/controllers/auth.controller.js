import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Department from "../models/department.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    // Here this DB call can be avoided by getting the previously fetched 'user' object.
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // Like this case in general to save anything the entire model gets verified with all the fields of the schema, to do that I have to pass data of all the fields of that userId, otherwise it will throw an error of "Insufficient data". But here I am passing the value of field 'refreshToken' only and I want to save only this value without any other validation. That's why I am putting that argument (validateBeforeSave: false).

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while generating tokens");
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized user");
    }

    // 1. Verify the token
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    if (!decodedRefreshToken) {
      throw new ApiError(403, "Invalid or expired refresh token");
    }

    // 2. Get the user (await is important!)
    const user = await User.findById(decodedRefreshToken._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 3. Compare refresh tokens
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(40, "Refresh token doesn't match");
    }

    // 4. Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // 5. Set cookies
    const options = {
      httpOnly: true,
      secure: true, // for HTTPS only (dev: false if needed)
      sameSite: "Strict", // optional but recommended
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

const registerPatient = async (req, res, next) => {
  /**
   * Here are two writes: User and Patient.
    (Without a transaction)
    if, User created ✅ but ❌ Patient creation fails
    Then, User document exists but Patient document doesn't exist
    Result: Your database becomes inconsistent.
   */
  // Transactions prevent partial database writes and keep related data consistent.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, age, gender, phone, address, bloodType } =
      req.body;

    // 1. Basic validation (don’t rely only on mongoose)
    if (!name || !email || !password || !age || !gender || !phone) {
      throw new ApiError(400, "Missing required fields");
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already registered");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    // 'User.create()' returns an array when passing an array 'User.create([{ ... }], { session })'. So destructuring ([user]) to get the first element.
    const [user] = await User.create(
      [
        {
          name,
          email,
          hashedPassword,
          role: "PATIENT",
        },
      ],
      { session },
    );

    // 5. Create Patient profile
    await Patient.create(
      [
        {
          userId: user._id,
          age,
          gender,
          phone,
          address,
          bloodType,
        },
      ],
      { session },
    );

    // 6. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(null, "Patient registered successfully"));
  } catch (error) {
    console.log("Patient registered failed");
    await session.abortTransaction();
    session.endSession();
    next(error); // IMPORTANT: centralized error handler
  }
};

const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // 2. Find user
    const user = await User.findOne({ email, role: "PATIENT" });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // 3. Check role
    if (user.role !== "PATIENT") {
      throw new ApiError(403, "Not authorized as PATIENT");
    }

    // 4. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // 5. Generate tokens
    // Here instead of passing the 'id' of user document the 'user' object should be passed in generateAccessAndRefreshToken() to avoid DB call again inside that function.
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );

    // 6. Cookie options
    const options = {
      httpOnly: true,
      secure: true,
    };

    // 7. Send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          },
          "Patient logged in successfully",
        ),
      );

    console.log("Patient logged in successfully");
  } catch (error) {
    console.log("Patient logged in failed");

    next(error);
  }
};

const registerDoctor = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      password,
      departmentId,
      specialization,
      experienceYears,
    } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !departmentId || !specialization) {
      throw new ApiError(400, "Missing required fields");
    }

    // 2. Ensure department exists
    const department = await Department.findById(departmentId);
    if (!department || !department.isActive) {
      throw new ApiError(404, "Department not found or inactive");
    }

    // 3. Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "Email already registered");
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create User (DOCTOR)
    const [user] = await User.create(
      [
        {
          name,
          email,
          passwordHash,
          role: "DOCTOR",
        },
      ],
      { session },
    );

    // 6. Create Doctor profile
    await Doctor.create(
      [
        {
          userId: user._id,
          departmentId,
          specialization,
          experienceYears,
        },
      ],
      { session },
    );

    // 7. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(null, "Doctor registered successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // 2. Find user
    const user = await User.findOne({ email, role: "DOCTOR" });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // 3. Check role
    if (user.role !== "DOCTOR") {
      throw new ApiError(403, "Not authorized as DOCTOR");
    }

    // 4. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // 5. Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );

    // 6. Cookie options
    const options = {
      httpOnly: true,
      secure: true,
    };

    // 7. Send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          },
          "Doctor Login successful",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// Logout depends on 'User' model and it is common for all roles
const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized");
    }

    // 1. Find user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      // token already invalid or reused
      throw new ApiError(403, "Invalid refresh token");
    }

    // 2. Invalidate refresh token
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // 3. Clear cookies
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

export {
  registerPatient,
  loginPatient,
  registerDoctor,
  loginDoctor,
  logoutUser,
  refreshAccessToken,
};
