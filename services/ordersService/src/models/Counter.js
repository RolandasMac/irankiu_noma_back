import mongoose from "mongoose";
import { number } from "../../../../schemas/allSchemas.js";

const numberSchema = new mongoose.Schema(number, {
  timestamps: true,
});

const Counter = mongoose.model("Counter", numberSchema);

export default Counter;
