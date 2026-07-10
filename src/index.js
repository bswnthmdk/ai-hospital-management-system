import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./database/index.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`BOOM! Server is running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
