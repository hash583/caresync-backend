import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 🔥 SUPPORT BOTH FORMATS
  const to = options.to || options.email;
  const text = options.text || options.message;

  if (!to) {
    console.log("❌ Email skipped: No recipient email provided.");
    return;
  }

  try {
    console.log("🟢 Sending email to:", to);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CareSync Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: options.subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);

  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw error;
  }
};

export default sendEmail;