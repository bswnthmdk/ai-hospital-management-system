import { createAgent, createTool, gemini } from "@inngest/agent-kit";
import { z } from "zod";

const submitAnalysis = createTool({
  name: "submit_ticket_analysis",
  description: "Submit the structured analysis of a patient's ticket",
  parameters: z.object({
    redefinedDescription: z
      .string()
      .describe("A clear, corrected version of the patient's description"),
    summary: z.string().describe("A short summary of the problem"),
    keywords: z.array(z.string()).describe("Key medical terms/symptoms"),
    confidence: z
      .enum(["HIGH", "MEDIUM", "LOW"])
      .describe("How confident the match is"),
    matchedDepartment: z
      .string()
      .describe("Best-fit department name from the provided list"),
  }),
  handler: async (params) => {
    // Just returns what the model gave us — no side effects here yet
    return params;
  },
});

export const ticketAgent = createAgent({
  name: "Ticket Analysis Agent",
  system:
    "You are a medical intake assistant. Analyze the patient's description and ALWAYS respond by calling the submit_ticket_analysis tool with your findings. Never reply in plain text.",
  model: gemini({
    model: "gemini-3.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  }),
  tools: [submitAnalysis],
});
