
require("dotenv").config();

const bcrypt = require("bcryptjs");
const {
  prisma,
  connectDB,
  disconnectDB,
} = require("../config/db");

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Pukaar Administrator";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env"
    );
  }

  if (password.length < 12) {
    throw new Error("Admin password must contain at least 12 characters.");
  }

  await connectDB();

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== "ADMIN") {
      throw new Error(
        "This email already belongs to a non-admin account."
      );
    }

    console.log("Administrator account already exists.");
    console.log(`Email: ${existingAdmin.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("\nAdministrator account created successfully!");
  console.log(`Name: ${admin.name}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
}

createAdmin()
  .catch((error) => {
    console.error("\nAdministrator creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
