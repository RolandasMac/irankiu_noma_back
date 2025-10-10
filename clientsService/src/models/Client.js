import mongoose from "mongoose";
import { clients } from "../../../schemas/allSchemas.js";

const clientSchema = new mongoose.Schema(clients, {
  timestamps: true,
});

const Client = mongoose.model("Client", clientSchema);

export default Client;
