import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service : "gmail",
  port : 587,
  secure : false,
  auth : {
    user : process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD
  }
});

export const sendEmailSignup = async (to, subject,username) => {
  const emailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to Yorkumi</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 0;">
  <table align="center" width="100%" style="max-width: 600px; background-color: #ffffff; margin-top: 50px; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #4a90e2; color: #ffffff; padding: 20px; text-align: center;">
        <h1>Welcome to Yorkumi!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; text-align: left; color: #333333;">
        <p>Hi there,</p>
        <p>Thank you for subscribing to Yorkumi ${username}!</p>
        <p>We're thrilled to have you with us. As a subscriber, you'll be the first to know about our latest sales, special discounts, and exclusive offers.</p>
        <p>Stay tuned — exciting things are on the way!</p>
        <p>Warm regards,<br><strong>The Yorkumi Team</strong></p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f0f0f0; text-align: center; padding: 15px; font-size: 12px; color: #888888;">
        © 2025 Yorkumi. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>

`

const send = await transporter.sendMail (
  { from : process.env.USER_EMAIL,
    to : to,
    subject: subject,
    html : emailTemplate
  }
)
console.log ("email sent", send)
}