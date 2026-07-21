import { inngest } from "../client.js";
import Ticket from "../../models/ticket.model.js";

export const processTicket = inngest.createFunction(
  {
    id: "process-ticket", //  Unique identifier for the function
    name: "Process Ticket", // Human-readable name for the function
    triggers: { event: "ticket/created" }, //  Set the trigger to listen for the "ticket/created" event
  },
  async ({ event, step }) => {
    const { ticketId } = event.data; //  The ticketId is passed in the event as payload data when the ticket is created in the controller.

    /*
     event — the whole event object that was sent. 
     step — a special tool Inngest gives you to break work into checkpointed pieces.
     step.run("some-label", async () => {...}) - runs that block of code and saves its result.
     */
    const ticket = await step.run("fetch-ticket", async () => {
      const found = await Ticket.findById(ticketId);
      if (!found) {
        throw new Error(`Ticket ${ticketId} not found`);
      }
      return found;
    });

    console.log(`Processing ticket ${ticketId}:`, ticket.rawDescription);

    // Gemini logic goes here in the next step
  },
);
