import mongoose from "mongoose";
import { discounts } from "../../../../schemas/allSchemas.js";

// Pakeičiame 'type: "ObjectId"' į tikrą mongoose tipą
const normalizedFields = {
  ...discounts,
  tools_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool", // 👈 turi sutapti su Tool modelio vardu
    },
  ],
};

const discountSchema = new mongoose.Schema(normalizedFields, {
  timestamps: true,
});

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
