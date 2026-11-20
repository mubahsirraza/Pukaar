
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  const requiredVariables = [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
  ];

  const missing = requiredVariables.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Email configuration is incomplete. Missing: ${missing.join(", ")}`
    );
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const mailer = getTransporter();

  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your Pukaar password",
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your Pukaar account password.",
      "Use the link below to choose a new password:",
      "",
      resetUrl,
      "",
      "This link expires in 15 minutes and can only be used once.",
      "If you did not request this, you can safely ignore this email.",
      "",
      "The Pukaar Team",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:32px 16px;background:#F8F7F4;font-family:Arial,sans-serif;color:#1F2937">
        <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E7E2D9;border-radius:16px;padding:32px">
          <h1 style="margin:0 0 8px;color:#0F5132;font-size:26px">PUKAAR</h1>
          <p style="margin:0 0 28px;color:#647067;font-size:12px;letter-spacing:1px">YOUR CITY. YOUR VOICE.</p>

          <h2 style="font-size:22px;margin:0 0 14px">Reset your password</h2>

          <p style="font-size:15px;line-height:1.6">
            Hello ${escapeHtml(name)},
          </p>

          <p style="font-size:15px;line-height:1.6">
            We received a request to reset your Pukaar account password.
            Click the button below to create a new password.
          </p>

          <a
            href="${escapeHtml(resetUrl)}"
            style="display:inline-block;margin:18px 0;padding:14px 24px;background:#0F5132;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:bold"
          >
            Reset Password
          </a>

          <p style="font-size:13px;line-height:1.6;color:#647067">
            This link expires in 15 minutes and can only be used once.
          </p>

          <p style="font-size:13px;line-height:1.6;color:#647067">
            If you did not request a password reset, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #E7E2D9;margin:24px 0" />

          <p style="font-size:12px;color:#647067">
            The Pukaar Team
          </p>
        </div>
      </div>
    `,
  });
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

module.exports = {
  sendPasswordResetEmail,
};
