import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";

// 🟢 Forgot Password - Send reset link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔍 Forgot password request for:", email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = user.getResetPasswordToken();
    await user.save();

    console.log("✅ Reset token generated:", resetToken);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("🔗 Reset URL:", resetUrl);

    const message = `
You requested a password reset. Click the link below to reset your password:
${resetUrl}
`;

    await sendEmail({
      email: user.email,
      subject: "CareSync Password Reset",
      message,
    });

    console.log("📨 Email sent successfully to:", user.email);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Email could not be sent", error: error.message });
  }
};


// 🟡 Reset Password - Verify token & update password
export const resetPassword = async (req, res) => {
  try {
    const resetToken = req.params.token;

    // Hash the token from URL to match DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // ✅ Only set plain password, don't hash manually (your schema's pre-save hook will hash automatically)
    user.password = req.body.password;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save(); // will trigger pre('save') and hash it

    res.status(200).json({ message: "Password reset successful. Please log in with your new password." });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
