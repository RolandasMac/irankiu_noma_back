// const path = require("path");
// const dotenv = require("dotenv");
// const jwt = require("jsonwebtoken");
// const User = require("../models/userSchema");
// // const { newError } = require("../plugins/helper");
// const { sendCoteMessageToError } = require("../plugins/innerMessages");
// const { getSetings } = require("../plugins/setings");
// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
// import { newError } from "../plugins/helper.js";
import { sendCoteMessageToError } from "../plugins/innerMessages.js";
import { getSetings } from "../plugins/setings.js";

// Kad veiktų __dirname ESM aplinkoje:
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
// let jwtKey = "key";
module.exports = {
  loginMiddleware: async (req, res, next) => {
    try {
      console.log("suveikė");
      // const setings = await getSetings("admin");
      // console.log("setings:", setings);
      const jwtKey = process.env.JWT_KEY;
      const token = req.cookies.authtoken;
      if (!token) {
        throw new Error("Negautas prisijungimmo tokenas");
      }
      // console.log("Middleware suveikimas. Tokenas:", token);
      // console.log(jwtKey);
      const user = jwt.verify(token, jwtKey);
      // console.log(user);
      if (!user) {
        throw new Error("Blogas tokenas");
      }
      // console.log(user);
      const findUser = await User.findOneAndUpdate(
        { email: user.email },
        { lastloggedAt: new Date() },
        { new: true, select: { password: 0 } }
      );
      if (findUser) {
        req.loggedIn = {
          name: findUser.name,
        };
        req.user = findUser;

        // console.log(findUser);
      } else {
        res
          .status(401)
          .json({ success: false, message: "Tokio vartotojo nėra" });
      }

      next();
    } catch (err) {
      const objError = {
        service: "authService",
        file: "middleware/loginMiddleware",
        place: "authMiddleware1",
        error: err.message,
      };
      // await newError(objError);
      await sendCoteMessageToError(objError);
      res.status(500).json({ message: err.message, success: false });
    }
  },
};
