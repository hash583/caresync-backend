import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🟢 Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate phone number
    if (!phone || phone.length < 10) {
      return res.status(400).json({ message: "Valid phone number required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone, // return phone
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};


// 🟡 Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📩 Login attempt:", email, password); // <-- add this

    // Find user by email and explicitly select password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ No user found with this email");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password using model method
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("✅ Login successful:", user.email);

    // Respond with user info and token
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
    });
  } catch (error) {
    console.error("🔥 Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
// 🔵 Get logged-in user
export const getMe = async (req, res) => {
  res.status(200).json(req.user);
};
