import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET || "exam_secret",
    { expiresIn: "8h" }
  );

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required." });
    }
    const emailNorm = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }
    const existingEmail = await User.findOne({ email: emailNorm });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered." });
    }
    const hash = await bcrypt.hash(password, 10);
    await User.create({ username: username.trim(), email: emailNorm, password: hash });
    return res.status(201).json({ message: "Account created successfully." });
  } catch {
    return res.status(500).json({ message: "Server error during registration." });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    return res.json({
      message: "Login successful.",
      token: signToken(user),
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch {
    return res.status(500).json({ message: "Server error during login." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required." });
    }
    if (!confirmPassword) {
      return res.status(400).json({ success: false, message: "Confirm password is required." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match.",
      });
    }
    const emailNorm = normalizeEmail(email);
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ success: true, message: "Password reset successfully" });
  } catch {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
