"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
;
// The main function to send an email
const sendMail = async (options) => {
    // create a transporter object using SMPT sttings from enviorment variable
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    //extract values
    const { email, subject, template, data } = options;
    // create the full path to the ejs template file
    const templatePath = path_1.default.join(__dirname, '../mails', template);
    // Render the EJS Template to HTML by injecting data into it
    const html = await ejs_1.default.renderFile(templatePath, data);
    //setup the email options
    const mailOptions = {
        from: process.env.SMTP_MAIL, // sender mail
        to: email, // Recipient
        subject, // subject line
        html, //The actual html content
    };
    // send the mail using transporter
    await transporter.sendMail(mailOptions);
};
exports.default = sendMail;
