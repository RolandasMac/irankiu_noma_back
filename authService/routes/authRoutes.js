const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const { checkRole } = require("../middleware/checkRole.js");
// const { loginMiddleware } = require("../middleware/loginMiddleware");

// router.get("/testas", loginMiddleware, authController.testas);
router.post("/test", authController.test);
// router.get("/getsetings", loginMiddleware, authController.getsetings);
router.get("/getusers", checkRole(["admin"]), authController.getusers);
router.get("/logout", authController.logout);
// router.get("/autologin", loginMiddleware, authController.autologin);
router.post("/sendemailcode", authController.sendEmailCode);
router.post("/createuser", authController.createUser);
router.post("/login", authController.login);
// router.post("/createsetings", loginMiddleware, authController.createsetings);

router.post("/updateuser", authController.updateuser);

// router.delete("/deleteuser", loginMiddleware, authController.deleteuser);

router.get("/refresh", authController.refresh);

module.exports = router;
