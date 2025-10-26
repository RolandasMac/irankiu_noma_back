// server.js
import fs from "fs";

import sendEmail from "./plugins/emailPlugin.js";
import express from "express";
// import mongoose from "mongoose";
import dotenv from "dotenv";
import emailRouter from "./routes/emailRoutes.js";
import path from "path";
import cors from "cors";
// import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { connectRabbit } from "./rabbit/connection.js";
import { startConsumer } from "./rabbit/consumer.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from a .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
// app.use(cookieParser());

const PORT = process.env.EMAILPORT;
// const PORTSSL = process.env.AUTHPORTSSL;
// const MONGODB_URI = process.env.MONGODB_URI;
const HOST = process.env.HOST;
const ADMINHOST = process.env.ADMINHOST;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       const allowedOrigins = [ADMINHOST, HOST];
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // Allow cookies and credentials
//   })
// );

// Connect to MongoDB
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log(`MongoDB connection error: ${err}`));

// Use the email router
app.use("/", emailRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(PORT);
// httpsServer.listen(6001);

// start rabbit consumer

async function start() {
  await connectRabbit();
  await startConsumer();
}

start();
