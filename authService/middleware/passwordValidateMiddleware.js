module.exports = {
  passwordValidateMiddleware: (req, res, next) => {
    // console.log(req.body);
    const { password, password1, password2 } = req.body;
    if (
      password.length === 0 ||
      password1.length === 0 ||
      password2.length === 0
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Laukeliai negali būti tušti" });
    }
    if (password1 !== password2) {
      return res
        .status(401)
        .json({ success: false, message: "Slaptažodžiai nesutampa" });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{5,20}$/;

    if (!passwordRegex.test(password1)) {
      return res.status(401).json({
        success: false,
        message: "Slaptažodis neatitinka reikalavimų",
      });
    }
    next();
  },
};
