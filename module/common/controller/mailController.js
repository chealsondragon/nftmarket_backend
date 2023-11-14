/*
Project : Cryptotrades
FileName : mailController.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to send email notificaiton to user
*/
var nodemailer = require('nodemailer');

/**
 * This is the function which used to send email 
 */
exports.sendOpt =  async function (reciever, opt) {  
  let w_return = false;
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: 'trustbusiness2021@gmail.com',    // your email
      pass: 'trustteam2021',     // email pass, put them in .env file & turn the 'Less secure apps' option 'on' in gmail settings
    },
  });

  const emailSent = await transporter.sendMail({
    from: 'trustbusiness2021@gmail.com',
    to: reciever,
    subject: 'Email verification to complete your registration!',
    text: 'Email Verification',
    html: `<p>For verify your email address, enter this verification code when prompted: <b>` + opt + `</b></p>
          <p>Sincerely,</p>
          <p>Crypto.info</p>`,
  });
  if (emailSent) {
    w_return = true;
  }
  return w_return;
 };
