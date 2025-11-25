import mongoose from "mongoose";
import { tools } from "../../../../schemas/allSchemas.js";

// Pridedame group lauką, kuris priklauso Mongoose
const schemaWithGroup = {
  ...tools,
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  required_addons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Addon",
      required: false,
    },
  ],
};

const toolSchema = new mongoose.Schema(schemaWithGroup, {
  timestamps: true,
});

const Tool = mongoose.model("Tool", toolSchema);

export default Tool;
