
require("dotenv").config();

const { PrismaClient } = require("../../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const connectDB = async () => {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`SELECT 1`;

    console.log("PostgreSQL database connected successfully!");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
};

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
