import { inngest } from "../client.js";

export const helloFunction = inngest.createFunction(
  {
    id: "hello-function",
    triggers: { event: "app/hello" },
  },
  async ({ event }) => {
    console.log(`Hello ${event.data.name}`);
    return { success: true };
  },
);
