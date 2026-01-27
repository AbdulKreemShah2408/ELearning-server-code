require('dotenv').config();
import nodemailer,{Transporter} from "nodemailer"
import ejs from "ejs"
import path from "path"
// define the type for email sending options
interface EmailOptions{
 email:string,
 subject:string,
 template:string,
 data:{[key:string]:any}
};

// The main function to send an email
const sendMail=async(options:EmailOptions):Promise<void>=>{
    // create a transporter object using SMPT sttings from enviorment variable
    const transporter:Transporter=nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:parseInt(process.env.SMTP_PORT || "587"),
        service:process.env.SMTP_SERVICE,
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD,
        },
    });
    //extract values
    const {email,subject,template,data}=options;

    // create the full path to the ejs template file
    const templatePath=path.join(__dirname,'../mails',template);

    // Render the EJS Template to HTML by injecting data into it
    const html:string=await ejs.renderFile(templatePath,data);
    //setup the email options
    const mailOptions={
        from:process.env.SMTP_MAIL,// sender mail
        to:email, // Recipient
        subject,  // subject line
        html, //The actual html content

    }
    // send the mail using transporter
        await transporter.sendMail(mailOptions);
}

export default sendMail;
