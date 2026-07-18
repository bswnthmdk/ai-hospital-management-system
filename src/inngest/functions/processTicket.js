import { inngest } from "../client.js";

export const processTicket = inngest.createFunction(
  {
    id: "process-ticket",
    triggers: { event: "ticket/created" },
  },
  async ({ event, step }) => {
    const { ticketId } = event.data;

    await step.run("log-ticket-received", async () => {
      console.log(`Processing ticket: ${ticketId}`);
      return { received: true, ticketId };
    });

    // Gemini logic will be added here in the next step
  },
);
