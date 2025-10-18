// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");
// const dotenv = require("dotenv");
// const path = require("path");
// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(new URL("../../../.env", import.meta.url).pathname),
});
const CLIENT_ID = process.env.EMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

async function sendEmail1(to, subject, text, data, status) {
  const html5 = `
        <div class="header">
            <h2>Jūsų užsakymas yra išsiųstas!</h2>
        </div>
        <div class="content">
            <p>Sveiki, <strong>${data.inform.clientFirstName}</strong>,</p>
            <p>Dėkojame, kad pasirinkote <strong>${data.setings.saler}</strong>! Norime informuoti, kad jūsų užsakymas <strong># ${data.inform.orderid}</strong> yra vykdomas.</p>
            <h3>Užsakymo informacija:</h3>
            <ul>
                <li><strong>Prekių kiekis:</strong>${data.inform.totalItems}</li>
                <li><strong>Bendra suma:</strong>${data.inform.totalAmount} €</li>
                <li><strong>Apmokėjimo būdas:</strong>Paysera</li>
                <li><strong>Pristatymo būdas:</strong>Omniva paštomatas</li>
            </ul>
            <h3>Pristatymo būsena:</h3>
            <p>Šiuo metu jūsų užsakymas yra: <strong> Išsiųstas</strong>.</p>
            <p>Norėdami sekti savo užsakymą, spauskite žemiau:</p>
            <a href="https://mano.omniva.lt/track/${data.inform.parcelBarcode}" target="_blank" class="button">Sekti užsakymą</a>
            <p>Jūsų siuntos numeris: <strong>${data.inform.parcelBarcode}</strong></p>
            <p>Jei turite klausimų, susisiekite su mumis el. paštu <a href="mailto:${data.setings.email}">${data.setings.email}</a> arba telefonu <strong>${data.setings.phone}</strong>.</p>
        </div>
        <div class="footer">
            <p>Pagarbiai,</p>
            <p><strong>${data.setings.saler}</strong></p>
            <p><a href="https://${data.setings.saler}">${data.setings.saler}</a> | <a href="mailto:${data.setings.email}">${data.setings.email}</a> | ${data.setings.phone}</p>
        </div> `;
  const html6 = `
        <div class="header">
            <h2>Jūsų užsakymas įvykdytas!</h2>
        </div>
        <div class="content">
            <p>Sveiki, <strong>${data.inform.clientFirstName}</strong>,</p>
            <p>Dėkojame, kad pasirinkote <strong>${data.setings.saler}</strong>! Norime informuoti, kad jūsų užsakymas <strong># ${data.inform.orderid}</strong> įvykdytas.</p>
            <h3>Užsakymo informacija:</h3>
            <ul>
                <li><strong>Prekių kiekis:</strong>${data.inform.totalItems}</li>
                <li><strong>Bendra suma:</strong>${data.inform.totalAmount} €</li>
                <li><strong>Apmokėjimo būdas:</strong>Paysera</li>
                <li><strong>Pristatymo būdas:</strong>Omniva paštomatas</li>
            </ul>
            <p>Dėkojame, kad naudojatės <strong>${data.setings.saler}</strong> paslaugomis!</p>
            <p>Lauksime Jūsų sugrįžtant į <strong>${data.setings.saler}</strong>.</p>
            <p>Jei turite klausimų, susisiekite su mumis el. paštu <a href="mailto:${data.setings.email}">${data.setings.email}</a> arba telefonu <strong>${data.setings.phone}</strong>.</p>
        </div>
        <div class="footer">
            <p>Pagarbiai,</p>
            <p><strong>${data.setings.saler}</strong></p>
            <p><a href="https://${data.setings.saler}">${data.setings.saler}</a> | <a href="mailto:${data.setings.email}">${data.setings.email}</a> | ${data.setings.phone}</p>
        </div>`;
  const content = status === 5 ? html5 : html6;
  const template = `<!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Užsakymo patvirtinimas</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
              text-align: center;
              background: #007bff;
              color: #ffffff;
              padding: 10px;
              border-radius: 10px 10px 0 0;
          }
          .content {
              padding: 20px;
              text-align: left;
          }
          .button {
              display: inline-block;
              padding: 10px 20px;
              background: #28a745;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
          }
          .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              padding-top: 20px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          ${content}
      </div>
  </body>
  </html>`;
  try {
    // Gauti prieigos tokeną iš OAuth2 kliento
    const accessToken = await oauth2Client.getAccessToken();
    // Sukuriame transporterį su Gmail paslaugomis ir OAuth2
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

    // Paruošiame laiško informaciją
    const mailOptions = {
      from: `"Gofresh" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html: template,
    };

    // Išsiunčiame el. laišką
    const result = await transporter.sendMail(mailOptions);
    // console.log("El. laiškas išsiųstas!", result);
    return result;
  } catch (error) {
    // console.error("Klaida siunčiant el. laišką:", error);
    throw error;
  }
}

module.exports = { sendEmail1 }; // Eksportuojame funkciją
