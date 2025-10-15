const Setings = require("../models/setingsSchema.js");

module.exports = {
  createSetings: async (setings) => {
    const setingsChange = await Setings.findOneAndUpdate(
      { admin: "admin" },
      { admin: "oldadmin" },
      { new: true }
    );
    console.log(setingsChange);
    if (!setingsChange) {
      throw new Error("Iškilo problema keičiant nustatymų parametrus");
    }
    const newSetings = new Setings(setings);

    const result = await newSetings.save();
    return result;

    // const {
    //   addressCountry,
    //   addressCity,
    //   addressPostCode,
    //   addressStreet,
    //   email,
    //   phone,
    //   personName,
    // } = setings;
    // const newSetings = new Setings({
    //   addressCountry: addressCountry,
    //   addressCity: addressCity,
    //   addressPostCode: addressPostCode,
    //   addressStreet: addressStreet,
    //   email: email,
    //   phone: phone,
    //   personName: personName,
    // });
  },
  getSetings: async (admin) => {
    // return "Gaidyssss";
    // console.log("Gaidys");
    try {
      const result = await Setings.findOne({
        "admin": admin,
      });
      // console.log("Result:", result);
      return result;
    } catch (err) {
      return err.message;
    }
  },
};
