// models/User.js
// const mongoose = require("mongoose");
// const { user } = require("../../schemas/allSchemas");

import mongoose from "mongoose";
import { user } from "../../../schemas/allSchemas.js";
const userSchema = new mongoose.Schema(user, {
  timestamps: true,
});

export const User = mongoose.model("User", userSchema);

// module.exports = User;
