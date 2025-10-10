import mongoose from "mongoose";
import { orders } from "../../../schemas/allSchemas.js";

const orderSchema = new mongoose.Schema(orders, {
  timestamps: true,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
