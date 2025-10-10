import mongoose from "mongoose";
import { tools } from "../../../schemas/allSchemas.js";

const toolSchema = new mongoose.Schema(tools, {
  timestamps: true,
});

const Tool = mongoose.model("Tool", toolSchema);

export default Tool;
