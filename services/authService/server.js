import fs from "fs";
// import http from "http";
// import https from "https";

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";
import path from "path";
import cookieParser from "cookie-parser";
import { connectRabbit } from "./rabbit/connection.js";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.AUTH_PORT;
// const PORTSSL = process.env.AUTHPORTSSL;
const MONGODB_URI = process.env.MONGO_URI;
// const HOST = process.env.HOST;
// const ADMINHOST = process.env.ADMINHOST;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(`MongoDB connection error: ${err}`));

// Use the user router
app.use("/", authRouter);

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

(async () => {
  try {
    await connectRabbit(); // 👈 Laukiam, kol RabbitMQ prisijungs

    // tik po to paleidžiam Express
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start service:", err);
    process.exit(1);
  }
})();

// var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(PORT);
// httpsServer.listen(6001);
