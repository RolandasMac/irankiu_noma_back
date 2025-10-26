// plugins/emailPlugin1.js
import nodemailer from "nodemailer";
import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
// Load environment variables from a .env file
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// 1️⃣ OAuth2 kredencialai
const CLIENT_ID = process.env.EMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
// Sukurkite OAuth2 klientą
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * Siunčia el. laišką naudojant Gmail ir OAuth2
 * @param {string} emailTo - gavėjo el. paštas
 * @param {string} subject - laiško tema
 * @param {string} html - laiško turinys HTML formatu
 */
async function sendMail(emailTo, subject, html) {
  try {
    // 2️⃣ Gaukite naują access tokeną
    const accessToken = await oAuth2Client.getAccessToken();

    // 3️⃣ Sukurkite transporterį
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // 4️⃣ Nustatykite el. laiško parinktis
    const mailOptions = {
      from: EMAIL_USER,
      to: emailTo,
      subject,
      html,
    };

    // 5️⃣ Išsiųskite el. laišką
    const result = await transporter.sendMail(mailOptions);
    return result && result.accepted.length > 0;
  } catch (error) {
    console.error("Klaida siunčiant el. laišką:", error);
    throw error;
  }
}

// Export funkcija kaip default
export default sendMail;
