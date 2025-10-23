const errorDb = require("../models/errorSchema");

module.exports = {
  newError: async (error) => {
    const newError = new errorDb({
      ...error,
      // time: Date.now(),
    });
    return await newError.save();
  },
};
