// controllers/userController.js

// const User = require("../models/userSchema");
// const bcrypt = require("bcrypt");
// // const emailPlugin = require("../plugins/emailPlugin");
// const authPlugin = require("../plugins/authPlugin");
// // const { newError } = require("../plugins/helper");
// // const { createSetings, getSetings } = require("../plugins/setings");
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// const path = require("path");
// dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// const { verify } = require("crypto");

import { User } from "../models/userSchema.js";
import bcrypt from "bcrypt";
// import emailPlugin from "../plugins/emailPlugin.js";
import { authPlugin } from "../plugins/authPlugin.js";
// import { newError } from "../plugins/helper.js";
// import { createSetings, getSetings } from "../plugins/setings.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { verify } from "crypto";

// Load environment variables from a .env file
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const HOST_COKIE = process.env.HOSTCOKIE;
// const {
//   sendCoteMessageToError,
//   sendCoteMessageToEmail,
// } = require("../plugins/innerMessages");

// const Setings = require("../models/setingsSchema.js");
// const { user } = require("../../../schemas/allSchemas.js");
// const UAParser = require("ua-parser-js");
// Generate a 6-digit code
// const JWT_key = process.env.JWT_KEY;
// const JWT_key = process.env.JWT_KEY;
const JWT_SECRET = process.env.JWT_KEY;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_KEY;
// async function getParamsfromSetings() {
//   const setings = await Setings.findOne({ admin: "admin" });
//   console.log(setings);
//   JWT_key = setings.jwtKey;
// }
// getParamsfromSetings();
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Access token – galioja 1h
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles, name: user.name },
    JWT_SECRET,
    // { expiresIn: "1h" }
    { expiresIn: "30s" }
  );
}

// Refresh token – galioja 30 dienų
function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export const sendEmailCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("El. paštas neperduotas");
    }
    console.log(email);
    const subject = "Email patvirtinimo koda";
    const userEmail = await User.findOne({ email: email }).select("email");
    if (userEmail) {
      return res.status(200).json({
        message: "Toks el. paštas jau egzistuoja",
        success: false,
      });
    }
    const code = generateVerificationCode();
    console.log(code);
    // code = "123456";
    const dataSave = authPlugin.saveEmail(email, code);
    // const sendEmail = await emailPlugin.sendVerifyEmail(email, subject, code);
    const data = {
      mailTo: email,
      subject,
      html: `<h1>${code}</h1>`,
    };
    // const result = await sendCoteMessageToEmail(data);
    console.log(result);
    if (result === "Email išsiųstas sėkmingai") {
      return res.status(200).json({ message: result, success: true, dataSave });
    }
    return res.status(200).json({ message: result, success: false });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "sendEmailCode",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createUser = async (req, res) => {
  try {
    // console.log("Veikia", req.body);
    // return res.status(200).json({ message: "Veikia", success: true });
    const { code, name, password1, email1 } = req.body;
    if (!code || !name || !password1) {
      throw new Error(
        "Neperduoti reikiami duomenys:kodas,vardas ar slaptažodis"
      );
    }
    const email = authPlugin.getEmailByCode(code);
    console.log("email: ", email);
    if (!email || email !== email1) {
      return res.status(200).json({
        success: false,
        message: "Neteisingas el. paštas arba patvirtinimo kodas",
        createdUser: {},
      });
    }
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password1, salt);
    const password = passHash;
    const newUser = await User.create({
      name: name,
      password: password,
      email: email,
      // photo: req.imageurl,
    });
    res.status(201).json({
      message: "Naujas vartotojas sukurtas ir išsaugotas duomenų bazėje",
      createdUser: {
        name: newUser.name,
        email: newUser.email,
        // photo: newUser.photo,
      },
      success: true,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "createUser",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("login data!!!", email);
    // Surandi user DB pagal email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Neteisingi duomenys1" });
    }
    console.log("User", user);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Neteisingi duomenys2" });
    }
    console.log("Dar veikia", JWT_SECRET);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Čia galima refresh token išsaugoti DB arba Redis (kad galėtumėm revoke)
    // pvz. user.refreshToken = refreshToken; await user.save();

    // Siunčiam abu tokenus kaip httpOnly cookies
    res.cookie("authtoken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1h
      // domain: ".localhost",
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
      // domain: ".localhost",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Prisijungimas sėkmingas",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    });
  } catch (err) {
    console.error("Login klaida:", err);
    res.status(500).json({ success: false, message: "Serverio klaida" });
  }
};

export const testas = async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"];
    console.log(`User-Agent: ${userAgent}`);
    // const parser = new UAParser();
    // const result = parser
    //   .setUA(
    //     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    //   )
    //   .getResult();

    // console.log(result);

    // *********************************************
    // const crypto = require("crypto");

    // const secret = "super-secret-key";

    // function generateSignedToken(data) {
    //   return crypto.createHmac("sha256", secret).update(data).digest("hex");
    // }

    // const token = generateSignedToken("your-data");
    // console.log(token);
    // **********************************************
    // function verifySignedToken(token, data) {
    //   const expectedToken = generateSignedToken(data);
    //   return token === expectedToken;
    // }

    // *********************************************

    const { name } = req.loggedIn;
    if (!name) {
      throw new Error("Klaida gaunant prisijungimo duomenis");
    }

    // sendCoteMessageToError("Žinutė perduota");

    res.status(200).json({
      message: `Vartotojas ${name} prisijungęs`,
      success: true,
      name,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "login",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const test = async (req, res) => {
  // const data = req.body.data;
  // console.log("User: ", req.headers);
  return res.status(200).json({
    message: `test endpoint veikia`,
    success: true,
    user: {
      name: req.headers["x-user-name"],
      email: req.headers["x-user-email"],
      id: req.headers["x-user-id"],
      roles: req.headers["x-user-roles"],
    },
  });

  try {
    // const userAgent = req.headers["user-agent"];
    // console.log(`User-Agent: ${userAgent}`);

    // const result = await sendCoteMessageToEmail(data);
    console.log(result);
    res.status(200).json({
      message: `test endpoint veikia`,
      success: true,
      // result,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "login",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const logout = async (req, res) => {
  const cookie = req.cookies;
  console.log("Logout veikia", cookie);
  try {
    // const token = req.cookies.authtokenas_Rolas;
    // console.log("Gaidys veikia");
    res.clearCookie("authtoken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      // domain: ".localhost",

      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      // domain: ".localhost",
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Atsijungimas sėkmingas!",
      // user: req.user,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "logout",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getusers = async (req, res) => {
  const query = req.query;
  if (!query) {
    throw new Error("Neperduoti jokie užklausos parametrai!");
  }
  // const filter = {};
  // if (query.docType) {
  //   console.log(query.docType);

  //   filter.type = String(query.docType);
  // }

  // Reikia totalCount by type!!!!!!!!!
  const totalUsers = await User.countDocuments();
  const desc = query.desc ? (query.desc === "true" ? 1 : -1) : 1;
  const skip = query.skip || 0;
  const limit = query.limit || 10;
  console.log("AuthService", skip, limit, desc);
  try {
    const users = await User.find({}, { password: 0 })
      .sort({ createdAt: desc })
      .skip(skip)
      .limit(limit);
    if (users.length === 0) {
      throw new Error("Vartotojų duomenų gauti nepavyko");
    }
    res.status(200).json({
      message: `Vartotojų duomenys gauti sėkmingai`,
      success: true,
      users,
      totalUsers,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "getusers",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateuser = async (req, res) => {
  try {
    const { id, name, email, roles } = req.body;

    if (!id || !name || !email || !roles) {
      throw new Error("Neperduoti parametrai: id, name, email arba roles");
    }
    const updateduser = await User.findOneAndUpdate(
      { _id: id },
      { name, email, roles },
      { new: true }
    ).select("-password");
    if (!updateduser) {
      throw new Error("Vartotojo duomenų atnaujinti nepavyko");
    }
    res.status(200).json({
      message: `Vartotojų duomenys sėkmingai atnaujinti`,
      success: true,
      updateduser,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "updateuser",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteuser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new Error("Neperduotas parametras: id");
    }
    const deleteduser = await User.findOneAndDelete({ _id: id });
    if (!deleteduser) {
      throw new Error("Vartotojo duomenų ištrinti nepavyko");
    }
    res.status(200).json({
      message: `Vartotojų duomenys sėkmingai ištrinti`,
      success: true,
      deleteduser,
    });
  } catch (err) {
    const objError = {
      service: "authService",
      file: "controllers/authController",
      place: "deleteuser",
      error: err.message,
    };
    // await sendCoteMessageToError(objError);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const refresh = async (req, res) => {
  try {
    // Variantai: refresh token gali atkeliauti body, header arba cookie.
    // console.log("cookie", req.cookies);
    // console.log("headers", req.headers["cookie"]);
    // console.log("body", req.body);
    // return res.status(200).json({ success: true, message: "Gaidys" });
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });

    // Validate refresh token (DB, Redis or jwt.verify)
    // Example: if refresh tokens are stored in DB as sessions
    // const session = await Sessions.findOne({ token: refreshToken });
    // if (!session || session.revoked) {
    //   return res
    //     .status(401)
    //     .json({ success: false, message: "Invalid refresh token" });
    // }

    // Optionally: check expiry in DB/session
    // Issue new access token

    // 1️⃣ Jei nori tik ištraukti payload be validacijos (decode, nesaugus variantas)
    // const decoded = jwt.decode(refreshToken);
    // console.log("Payload:", decoded);
    let verified = null;
    // 2️⃣ Jei nori patikrinti parašą (saugus variantas – rekomenduojamas)
    try {
      verified = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      console.log("Verified payload:", verified);
    } catch (err) {
      console.error("Invalid or expired refresh token", err.message);
    }

    // return res.status(200).json({ success: true, message: "Gaidys" });
    const user = await User.findById(verified.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Neteisingi duomenys.Toks vartotojas nerastas.",
      });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // session.token = newRefreshToken;
    // session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 d
    // await session.save();

    // Return both tokens (or set cookie)
    res.cookie("authtoken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        name: user.name,
        email: user.email,
        roles: user.roles,
        id: user.id,
      },
    });
  } catch (err) {
    console.error("refresh error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
