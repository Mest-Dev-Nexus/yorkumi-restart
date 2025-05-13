import jwt from 'jsonwebtoken';
import {UserModel} from '../models/user.js';
import nodemailer from 'nodemailer';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // Generate a short-lived reset token (15 minutes)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: '15m'
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or your preferred email service
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Yorkumi Support" <${process.env.USER_EMAIL}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below to continue:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Password reset link sent to your email' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};
