import mongoose from "mongoose";
import { groups } from "../../../../schemas/allSchemas.js";

const groupSchema = new mongoose.Schema(groups, {
  timestamps: true,
});

const Group = mongoose.model("Group", groupSchema);

export default Group;
