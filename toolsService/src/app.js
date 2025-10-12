import express from "express";
import cors from "cors";
import "express-async-errors";
import toolsRoutes from "./routes/tools.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import paths from "../../config/paths.js";

const { imageUploadsDir } = paths;

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));

  app.use("/tools", toolsRoutes);
  app.use("/imageUploads", express.static(imageUploadsDir));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
