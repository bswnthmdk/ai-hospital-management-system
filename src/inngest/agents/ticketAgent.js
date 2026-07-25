import { createAgent, createTool, gemini } from "@inngest/agent-kit";
import { z } from "zod";

const submitAnalysis = createTool({
  name: "submit_ticket_analysis",
  description: "Submit the structured analysis of a patient's ticket",
  parameters: z.object({
    redefinedDescription: z.string(),
    summary: z.string(),
    keywords: z.array(z.string()),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
    matchedDepartment: z
      .string()
      .describe(
        "Must be EXACTLY one of the department names provided in the prompt — never invent a new one",
      ),
    clarifyingQuestions: z
      .array(z.string())
      .describe(
        "2-3 yes/no questions to ask the patient ONLY if confidence is MEDIUM or LOW. Empty array if confidence is HIGH.",
      ),
  }),
  handler: async (params) => params,
});

export const createTicketAgent = (nameSuffix) =>
  createAgent({
    name: `Ticket Analysis Agent - ${nameSuffix}`,
    system:
      "You are a medical intake assistant. Analyze the patient's description and ALWAYS respond by calling the submit_ticket_analysis tool with your findings. Never reply in plain text.",
    model: gemini({
      model: "gemini-3.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    tools: [submitAnalysis],
  });
