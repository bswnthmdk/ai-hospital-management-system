import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // 1. Extract token
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    // 2. Verify token (signature + expiry)
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Fetch user
    const user = await User.findById(decoded._id).select(
      "-hashedPassword -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    // 4. Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired access token"));
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user.role}' is not allowed to access this resource`
        )
      );
    }

    next();
  };
};
