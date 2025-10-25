import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Welcome to Testrack - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #464BD9 0%, #301994 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Testrack!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fc;">
          <h2 style="color: #050315; margin-bottom: 20px;">Hi ${data.displayName || 'there'}!</h2>
          <p style="color: #050315; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining Testrack, the ultimate platform for managing your Web3 testnet activities. 
            To get started, please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" 
               style="background: #464BD9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't create an account with Testrack, you can safely ignore this email.
          </p>
        </div>
        <div style="background: #050315; padding: 20px; text-align: center;">
          <p style="color: #DEDCFF; margin: 0; font-size: 14px;">
            © 2024 Testrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Testrack - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #464BD9 0%, #301994 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fc;">
          <h2 style="color: #050315; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="color: #050315; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password for your Testrack account. 
            Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" 
               style="background: #464BD9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email. 
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
        <div style="background: #050315; padding: 20px; text-align: center;">
          <p style="color: #DEDCFF; margin: 0; font-size: 14px;">
            © 2024 Testrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),

  testnetReminder: (data) => ({
    subject: `Testrack Reminder: ${data.testnetName} deadline approaching`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #464BD9 0%, #301994 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Deadline Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fc;">
          <h2 style="color: #050315; margin-bottom: 20px;">Don't miss your testnet deadline!</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #464BD9; margin-bottom: 25px;">
            <h3 style="color: #050315; margin: 0 0 10px 0;">${data.testnetName}</h3>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Time remaining: <strong style="color: #464BD9;">${data.timeRemaining}</strong>
            </p>
          </div>
          <p style="color: #050315; line-height: 1.6; margin-bottom: 25px;">
            Your testnet participation deadline is approaching. Make sure to complete your tasks before the deadline to avoid missing out!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardLink}" 
               style="background: #464BD9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="background: #050315; padding: 20px; text-align: center;">
          <p style="color: #DEDCFF; margin: 0; font-size: 14px;">
            © 2024 Testrack. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();

    let emailContent = {};

    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
    } else {
      emailContent = { subject, html, text };
    }

    const mailOptions = {
      from: `"Testrack" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject || subject,
      html: emailContent.html || html,
      text: emailContent.text || text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send bulk emails
export const sendBulkEmails = async (emails) => {
  try {
    const transporter = createTransporter();
    const results = [];

    for (const email of emails) {
      try {
        const result = await sendEmail(email);
        results.push({ success: true, messageId: result.messageId, email: email.to });
      } catch (error) {
        results.push({ success: false, error: error.message, email: email.to });
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

export default { sendEmail, sendBulkEmails };