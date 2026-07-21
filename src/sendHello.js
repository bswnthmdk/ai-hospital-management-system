import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

const { inngest } = await import("./inngest/client.js");

await inngest.send({
  name: "app/hello",
  data: {
    name: "Biswanath",
  },
});

console.log("Event sent");
