import express from "express";
import cors from "cors";
import docsRoutes from "./routes/docsRoutes.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectRabbit } from "./rabbit/connection.js";
import { startOrderConsumer } from "./rabbit/consumer.js";
// ESM alternatyva __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Užkraunam .env iš projekto šaknies
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

console.log("ENV loaded:", process.env.NODE_ENV);

const PORT = process.env.DOCS_PORT || 4006;
const app = express();
app.use(cors());
app.use("/", docsRoutes);

app.listen(PORT, async () => {
  console.log(`📄 Docs service running at http://localhost:${PORT}`);
  try {
    await connectRabbit();
    await startOrderConsumer();
  } catch (err) {
    console.error("RabbitMQ start failed:", err);
  }
});
