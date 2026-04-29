import Booking from "../models/NurseBooking.js";
import sendEmail from "../utils/sendEmail.js";

export const bookNurse = async (req, res) => {
  try {
    const { nurseName, nurseEmail, userName, userEmail } = req.body;

    // 🔍 DEBUG LOG (VERY IMPORTANT)
    console.log("🔥 Incoming Booking Data:", req.body);

    // ❌ VALIDATION (prevents undefined errors)
    if (!userEmail) {
      console.log("❌ Missing user email");
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    if (!nurseEmail) {
      console.log("❌ Missing nurse email");
      return res.status(400).json({
        success: false,
        message: "Nurse email is required",
      });
    }

    // ✅ SAVE BOOKING IN DATABASE
    const booking = await Booking.create({
      nurseName,
      nurseEmail,
      userName,
      userEmail,
    });

    // 📧 SEND EMAIL TO USER
    await sendEmail({
      to: userEmail,
      subject: "CareSync - Booking Confirmation",
      text: `Dear ${userName || "User"},

Your booking request for ${nurseName} has been successfully received.

Our caregiver will contact you shortly.

Thank you for choosing CareSync.`,
    });

    console.log("✅ User email sent to:", userEmail);

    // 📧 SEND EMAIL TO NURSE (DEMO OR REAL)
    await sendEmail({
      to: nurseEmail,
      subject: "New Booking Request - CareSync",
      text: `Hello,

You have received a new booking request.

Patient Name: ${userName}
Patient Email: ${userEmail}

Please contact the user as soon as possible.`,
    });

    console.log("✅ Nurse email sent to:", nurseEmail);

    // ✅ SUCCESS RESPONSE
    res.status(200).json({
      success: true,
      message: "Booking successful & emails sent",
      booking,
    });

  } catch (error) {
    console.error("❌ BOOKING ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Booking failed",
      error: error.message,
    });
  }
};