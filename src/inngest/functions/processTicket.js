import { inngest } from "../client.js";
import { createTicketAgent } from "../agents/ticketAgent.js";
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
    id: "process-ticket",
    name: "Process Ticket",
    triggers: { event: "ticket/created" },
  },
  async ({ event, step }) => {
    const { ticketId } = event.data;

    const ticket = await step.run("fetch-ticket", async () => {
      const found = await Ticket.findById(ticketId);
      if (!found) throw new Error(`Ticket ${ticketId} not found`);
      return found;
    });

    const departments = await step.run("fetch-departments", async () => {
      return await Department.find({ isActive: true }).lean();
    });

    // First AI pass — distinct agent instance
    const firstPassAgent = createTicketAgent("Initial");
    const firstPrompt = buildTicketPrompt(ticket.rawDescription, departments);
    const firstResponse = await firstPassAgent.run(firstPrompt);
    let analysis = extractAnalysis(firstResponse);

    if (analysis.confidence !== "HIGH") {
      await step.run("save-questions", async () => {
        await Ticket.findByIdAndUpdate(ticketId, {
          clarifyingQA: analysis.clarifyingQuestions.map((q) => ({
            question: q,
          })),
        });
      });

      const answerEvent = await step.waitForEvent("wait-for-answers", {
        event: "ticket/questions-answered",
        match: "data.ticketId",
        timeout: "1d",
      });

      if (!answerEvent) {
        await step.run("mark-abandoned", async () => {
          await Ticket.findByIdAndUpdate(ticketId, { status: "FAILED" });
        });
        return { status: "FAILED", reason: "No answer received in time" };
      }

      const updatedTicket = await step.run("fetch-answers", async () => {
        return await Ticket.findById(ticketId);
      });

      // Second AI pass — different distinct agent instance
      const secondPassAgent = createTicketAgent("FollowUp");
      const followUpPrompt = buildFollowUpPrompt(
        ticket.rawDescription,
        departments,
        updatedTicket.clarifyingQA,
      );
      const secondResponse = await secondPassAgent.run(followUpPrompt);
      analysis = extractAnalysis(secondResponse);
    }

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
