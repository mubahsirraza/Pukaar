
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { prisma } = require("../config/db");
const {
  sendPasswordResetEmail,
} = require("../services/emailService");

const RESET_TOKEN_EXPIRY_MINUTES = 15;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const requestPasswordReset = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account exists with that email address, password reset instructions will be sent.",
  };

  try {
    const email = req.body.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    // Do not disclose whether an account exists.
    if (!user || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    // Replace any previous unused reset links for this user.
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      }),

      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const resetBaseUrl =
      process.env.PUKAAR_RESET_URL || "pukaar://reset-password";

    const separator = resetBaseUrl.includes("?") ? "&" : "?";

    const resetUrl =
      `${resetBaseUrl}${separator}token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      // A token that was not emailed must not remain usable.
      await prisma.passwordResetToken.deleteMany({
        where: { tokenHash },
      });

      throw emailError;
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error(
      "Password reset request failed:",
      error.message
    );

    return res.status(200).json(genericResponse);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashToken(token);
    const now = new Date();

    const resetRecord =
      await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt <= now
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Claim the token only once. This also protects against
    // two simultaneous reset requests using the same link.
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetRecord.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          usedAt: now,
        },
      });

      if (claimed.count !== 1) {
        const error = new Error("RESET_TOKEN_INVALID");
        error.code = "RESET_TOKEN_INVALID";
        throw error;
      }

      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });

      // Remove all other reset links belonging to this user.
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetRecord.userId,
          id: { not: resetRecord.id },
        },
      });
    });

    return res.status(200).json({
      success: true,
      message:
        "Your password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    if (error.code === "RESET_TOKEN_INVALID") {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    console.error("Password reset failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password. Please try again.",
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
