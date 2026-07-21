// Individual Inngest functions will be added here as we build them
// e.g. export const processTicket = inngest.createFunction(...)
import { helloFunction } from "./functions/helloFunction.js";
import { processTicket } from "./functions/processTicket.js";

export const functions = [helloFunction, processTicket];
