// const express = require("express");
// const authController = require("../controllers/authController");
// const { checkRole } = require("../middleware/checkRole.js");

import express from "express";
import {
  test,
  getusers,
  logout,
  sendEmailCode,
  createUser,
  login,
  updateuser,
  refresh,
  getUser,
} from "../controllers/authController.js";
import { checkRole } from "../middleware/checkRole.js";

// const { loginMiddleware } = require("../middleware/loginMiddleware");
const router = express.Router();
// router.get("/testas", loginMiddleware, authController.testas);
router.post("/test", test, logout);
// router.get("/getsetings", loginMiddleware, authController.getsetings);
router.get("/getusers", checkRole(["admin"]), getusers);
router.get("/logout", logout);
// router.get("/logout", (req, res) => {
//   console.log("BACKEND logout pasiektas");
//   res.cookie("authtoken", "", { maxAge: 0 });
//   res.cookie("refreshToken", "", { maxAge: 0 });
//   res.status(200).json({ success: true });
// });
// router.get("/autologin", loginMiddleware, authController.autologin);
router.post("/sendemailcode", sendEmailCode);
router.post("/createuser", createUser);
router.post("/login", login);
router.get("/getUser/:id", checkRole(["admin"]), getUser);
// router.post("/createsetings", loginMiddleware, authController.createsetings);

router.post("/updateuser/:id", checkRole(["admin"]), updateuser);

// router.delete("/deleteuser", loginMiddleware, authController.deleteuser);

router.get("/refresh", refresh);

export default router;
