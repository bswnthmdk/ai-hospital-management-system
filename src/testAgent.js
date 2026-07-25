import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

const { ticketAgent } = await import("./inngest/agents/ticketAgent.js");

const response = await ticketAgent.run(
  "I've had a sharp pain in my chest for two days, especially when I breathe deeply.",
);

console.log(response.output);
