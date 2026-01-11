import express from "express";
import cors from "cors";
import "express-async-errors";
import toolsRoutes from "./routes/tools.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import paths from "../../../config/paths.js";

const { imageUploadsDir, thumbnailsDir, toolManualsDir } = paths;

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));

  app.use("/", toolsRoutes);
  app.use("/imageUploads", express.static(imageUploadsDir));
  app.use("/thumbnails", express.static(thumbnailsDir));
  app.use("/manuals", express.static(toolManualsDir));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
