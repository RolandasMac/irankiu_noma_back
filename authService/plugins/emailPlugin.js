const nodemailer = require("nodemailer");
// const Setings = require("../models/setingsSchema.js");
const emailTemplate = (verificationCode) => `
   <div style="padding: 16px; text-align: center; font-family: Arial, sans-serif;">
        <div style="background-color: white; padding: 24px; max-width: 500px; margin: auto;">
            // <div style="display: block; margin-bottom: 16px;">
            //     <div style="font-size: 24px; float: left;">📦</div>
            //     <div style="font-size: 12px; float: right;">"userName"</div>
            //     <div style="clear: both;"></div>
            // </div>
            <div style="height: 1px; opacity: 50%; background-color: #afafaf; width: 100%; margin-top: 20px; margin-bottom: 20px"></div>
            <h1 style="font-size: 24px; font-weight: 600;">Jūsų patvirtinimo kodas</h1>
            <p style="color: #6b7280; font-size: 12px;">Prašome įvesti šį patvirtinimo kodą į reikiamą laukelį:</p>
            <div style="padding: 32px; background-color: #f3f4f6; font-size: 40px;">${verificationCode}</div>
        </div>
        <div style="color: #9ca3af; font-size: 10px;">Copyright © ${new Date().getFullYear()} - All right reserved by Ship App</div>
    </div>

`;

const emailPlugin = {
  sendVerifyEmail: async (email, subject, verificationCode) => {
    console.log("email:", email);
    console.log("subject:", subject);
    console.log("verificationCode:", verificationCode);

    // const setings = await Setings.findOne({ admin: "admin" });
    console.log(process.env.GMAIL);

    if (!email || !subject || !verificationCode) {
      throw new Error("Trūksta parametrų");
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASS,
        // user: "nenarkotikams@gmail.com",
        // pass: "qrhhedlzasmmyhqt",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    // const transporter = nodemailer.createTransport(setings.nodemailerObject);
    const mailOptions = {
      from: process.env.GMAIL,
      to: email,
      subject: subject,
      html: emailTemplate(verificationCode),
    };

    const emailMessage = await transporter.sendMail(mailOptions);
    if (!emailMessage) {
      throw new Error("Nepavyko išsiųsti el. paštu patvirtinimo kode");
    }
console.log("Email:",emailMessage);
    return { message: "Patvirtinimo kodas išsiųstas sėkmingai" };
  },
};

module.exports = emailPlugin;
