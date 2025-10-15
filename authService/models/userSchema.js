// models/User.js
const mongoose = require("mongoose");
const { user } = require("../../schemas/allSchemas");

const userSchema = new mongoose.Schema(user, {
  timestamps: true,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
