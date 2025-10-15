// models/errorSchema.js
const mongoose = require("mongoose");
const { error } = require("../../../schemas/allSchemas");

const errorSchema = new mongoose.Schema(error, {
  timestamps: true,
});

const Error = mongoose.model("Error", errorSchema);

module.exports = Error;
