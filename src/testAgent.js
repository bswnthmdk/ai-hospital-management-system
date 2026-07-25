import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

import mongoose from "mongoose";

const { ticketAgent } = await import("./inngest/agents/ticketAgent.js");
const { buildTicketPrompt } =
  await import("./inngest/utils/buildTicketPrompt.js");
const { default: Department } = await import("./models/department.model.js");

await mongoose.connect(process.env.MONGODB_URI);

const departments = await Department.find({ isActive: true });

const prompt = buildTicketPrompt(
  "I've had a sharp pain in my chest for two days, especially when I breathe deeply.",
  departments,
);

const response = await ticketAgent.run(prompt);

console.log(JSON.stringify(response.output, null, 2));

await mongoose.disconnect();
