import mongoose from "mongoose";
import { discounts } from "../../../schemas/allSchemas.js";

const discountSchema = new mongoose.Schema(discounts, {
  timestamps: true,
});

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
