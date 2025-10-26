// routes/emailRoutes.js
import express from "express";
import sendMail from "../plugins/emailPlugin.js";
// import { loginMiddleware } from "../middleware/loginMiddleware.js";
// import authController from "../controllers/authController.js";

const router = express.Router();

router.post("/testas", async (req, res) => {
  const { email, subject, html } = req.body;
  try {
    const result = await sendMail(email, subject, html);
    if (result) {
      return res
        .status(200)
        .json({ success: true, message: "Test email sent successfully" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Test email sending failed" });
  } catch (err) {
    console.error("Email send error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while sending email" });
  }
});

// router.get("/getsetings", loginMiddleware, authController.getsetings);
// router.get("/getusers", loginMiddleware, authController.getusers);

export default router;
