import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./utils/db.js";
import { createApp } from "./app.js";
import { connectRabbit } from "./rabbit/rabbitConnection.js";
import { startClientRpcListener } from "./rabbit/rpcClientHandler.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = process.env.CLIENT_PORT || 4002;
const MONGODB_URI = process.env.MONGO_URI;

async function start() {
  try {
    await connectDB(MONGODB_URI);
    const app = createApp();
    await connectRabbit();
    await startClientRpcListener();
    app.listen(PORT, () =>
      console.log(`✅ Clients service running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
