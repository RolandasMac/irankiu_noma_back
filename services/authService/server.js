// server.js
// const fs = require("fs");
// // const http = require("http");
// // const https = require("https");
// // const privateKey = fs.readFileSync("../../cert/private.key", "utf8");
// // const certificate = fs.readFileSync("../../cert/certificate.crt", "utf8");

// // const credentials = { key: privateKey, cert: certificate };

// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const authRouter = require("./routes/authRoutes");
// const path = require("path");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");

// // Load environment variables from a .env file
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

import fs from "fs";
// import http from "http";
// import https from "https";
// const privateKey = fs.readFileSync(new URL("../../cert/private.key", import.meta.url), "utf8");
// const certificate = fs.readFileSync(new URL("../../cert/certificate.crt", import.meta.url), "utf8");

// const credentials = { key: privateKey, cert: certificate };

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

// Load environment variables from a .env file
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.AUTH_PORT;
// const PORTSSL = process.env.AUTHPORTSSL;
const MONGODB_URI = process.env.MONGO_URI;
const HOST = process.env.HOST;
const ADMINHOST = process.env.ADMINHOST;
// Middleware to parse JSON

// app.use(
//   cors({
//     // origin: `${ADMINHOST}`, // Replace with your frontend's origin
//     origin: (origin, callback) => {
//       const allowedOrigins = [ADMINHOST, HOST];
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // This allows cookies and other credentials to be sent
//   })
// );

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(`MongoDB connection error: ${err}`));

// Use the user router
// app.use("/", (req, res) => {
//   console.log("hello");
//   return res.status(200).send("hello");
// });
app.use("/", authRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// var httpServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(PORT);
// httpsServer.listen(6001);
