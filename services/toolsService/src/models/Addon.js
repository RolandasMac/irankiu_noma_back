import mongoose from "mongoose";
import { addons } from "../../../../schemas/allSchemas.js";

const addonSchema = new mongoose.Schema(addons, {
  timestamps: true,
});

const Addon = mongoose.model("Addon", addonSchema);

export default Addon;
