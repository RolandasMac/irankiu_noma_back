import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM alternatyva __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Užkraunam .env iš projekto šaknies
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log("ENV loaded:", process.env.NODE_ENV);

import postsRouter from "./routes/posts.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/posts", postsRouter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404 & error handlers
app.use(notFound);
app.use(errorHandler);

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
