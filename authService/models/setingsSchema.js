// models/Paymentss.js
const mongoose = require("mongoose");
const { setings } = require("../../../schemas/allSchemas");

const setingsSchema = new mongoose.Schema(setings, {
  timestamps: true,
});

const Setings = mongoose.model("Setings", setingsSchema);

module.exports = Setings;
