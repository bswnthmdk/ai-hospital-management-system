import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.route.js";
import errorHandler from "./middlewares/errHandler.middleware.js";

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// test route
app.get("/", (req, res) => {
  console.log("Hospital backend running");
  res.send("Hospital backend running");
});

// routes
app.use("/api/v1/auth", authRouter);

// centralized error handler — must be registered last
app.use(errorHandler);

export default app;
