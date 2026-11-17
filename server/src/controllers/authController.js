
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");

// Generate JWT token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Return safe user information
const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

// Citizen registration
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input format.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 1 and 100 characters.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        phone:
          typeof phone === "string" && phone.trim()
            ? phone.trim()
            : null,
        // Public registration always creates a citizen.
        role: "CITIZEN",
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};


// Get currently authenticated user's profile
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  getMe,
};
