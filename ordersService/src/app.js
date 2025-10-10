import express from "express";
import cors from "cors";
import "express-async-errors";
import ordersRoutes from "./routes/orders.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));

  app.use("/orders", ordersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
