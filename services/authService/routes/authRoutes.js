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

const router = express.Router();
router.post("/test", test);
router.get("/getusers", checkRole(["admin"]), getusers);
router.get("/logout", logout);
router.post("/sendemailcode", sendEmailCode);
router.post("/createuser", createUser);
router.post("/login", login);
router.get("/getUser/:id", checkRole(["admin"]), getUser);
router.post("/updateuser/:id", checkRole(["admin"]), updateuser);
router.get("/refresh", refresh);

export default router;
