import { createAgent, gemini } from "@inngest/agent-kit";

export const ticketAgent = createAgent({
  name: "Ticket Analysis Agent",
  system:
    "You are a medical intake assistant. Read the patient's description and respond helpfully.",
  model: gemini({
    model: "gemini-3.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  }),
});
