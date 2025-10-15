const authPlugin = require("../plugins/authPlugin");

module.exports = {
  emailValidateMiddleware: (req, res, next) => {
    const userInfo = req.tokenInfo;
    const { password, code, email } = req.body;
    const newEmail = authPlugin.getEmailByCode(code);

    //   console.log(req.body);
    //   const { password, password1, password2 } = req.body;
    if (password.length === 0 || code.length === 0 || email.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Laukeliai negali būti tušti" });
    }
    if (email !== newEmail) {
      return res
        .status(401)
        .json({ success: false, message: "El. pašto adresai nesutampa" });
    }
    next();
  },
};
