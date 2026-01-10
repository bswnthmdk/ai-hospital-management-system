import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token missing");
    }

    const token = auth.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired token");
    }

    // attach minimal user info; controllers can fetch full user if needed
    req.user = { id: payload.id, role: payload.role };

    // optional: validate user still exists
    const userExists = await User.exists({ _id: payload.id });
    if (!userExists) throw new ApiError(401, "User no longer exists");

    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) throw new ApiError(401, "Unauthorized");
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw new ApiError(403, "Forbidden");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default { authenticate, authorize };
