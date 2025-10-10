import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./utils/db.js";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = process.env.ORDER_PORT || 4004;
const MONGODB_URI = process.env.MONGO_URI;

async function start() {
  try {
    await connectDB(MONGODB_URI);
    const app = createApp();
    app.listen(PORT, () =>
      console.log(`✅ Orders service running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
