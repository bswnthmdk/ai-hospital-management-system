import { inngest } from "../client.js";
import { ticketAgent } from "../agents/ticketAgent.js";
import { buildTicketPrompt } from "../utils/buildTicketPrompt.js";
import { buildFollowUpPrompt } from "../utils/buildFollowUpPrompt.js";
import Ticket from "../../models/ticket.model.js";
import Department from "../../models/department.model.js";

const extractAnalysis = (response) => {
  const toolCall = response.output.find((msg) => msg.type === "tool_call");
  if (!toolCall) throw new Error("AI did not return structured analysis");
  return toolCall.tools[0].input;
};

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

    // Step 1 — fetch ticket + departments
    const ticket = await step.run("fetch-ticket", async () => {
      const found = await Ticket.findById(ticketId);
      if (!found) throw new Error(`Ticket ${ticketId} not found`);
      return found;
    });

    const departments = await step.run("fetch-departments", async () => {
      return await Department.find({ isActive: true }).lean();
    });

    // AI call — NOT wrapped in step.run, AgentKit handles its own steps internally
    const firstPrompt = buildTicketPrompt(ticket.rawDescription, departments);
    const firstResponse = await ticketAgent.run(firstPrompt);
    let analysis = extractAnalysis(firstResponse);

    if (analysis.confidence !== "HIGH") {
      // Save questions on the ticket (no answers yet)
      await step.run("save-questions", async () => {
        await Ticket.findByIdAndUpdate(ticketId, {
          clarifyingQA: analysis.clarifyingQuestions.map((q) => ({
            question: q,
          })),
        });
      });

      // Pause — wait for the patient to answer, timeout after 1 day
      const answerEvent = await step.waitForEvent("wait-for-answers", {
        event: "ticket/questions-answered",
        match: "data.ticketId",
        timeout: "1d",
      });

      if (!answerEvent) {
        // Patient never answered in time
        await step.run("mark-abandoned", async () => {
          await Ticket.findByIdAndUpdate(ticketId, { status: "FAILED" });
        });
        return { status: "FAILED", reason: "No answer received in time" };
      }

      // Step 4 — second AI pass using the answers
      const updatedTicket = await step.run("fetch-answers", async () => {
        return await Ticket.findById(ticketId);
      });

      // Second AI call — also NOT wrapped in step.run
      const followUpPrompt = buildFollowUpPrompt(
        ticket.rawDescription,
        departments,
        updatedTicket.clarifyingQA,
      );
      const secondResponse = await ticketAgent.run(followUpPrompt);
      analysis = extractAnalysis(secondResponse);
    }

    // Step 5 — save final analysis
    await step.run("save-final-analysis", async () => {
      const matchedDept = departments.find(
        (d) => d.name === analysis.matchedDepartment,
      );

      await Ticket.findByIdAndUpdate(ticketId, {
        redefinedDescription: analysis.redefinedDescription,
        summary: analysis.summary,
        keywords: analysis.keywords,
        confidence: analysis.confidence,
        matchedDepartmentId: matchedDept?._id,
        status: matchedDept ? "PROCESSED" : "FAILED",
      });
    });

    console.log(`Ticket ${ticketId} processed successfully`);
  },
);
