import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testSMTP = async () => {
  console.log("Host:", process.env.SMTP_HOST);
  console.log("User:", process.env.SMTP_USER);
  console.log("Pass length:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

  if (!process.env.SMTP_USER) {
    console.log("No SMTP_USER found in .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP Connection successful!");
  } catch (error) {
    console.error("SMTP Connection Error:", error);
  }
};

testSMTP();
