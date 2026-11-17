
const { prisma, connectDB, disconnectDB } = require("../config/db");

const departments = [
  {
    name: "Roads / Works",
    description: "Responsible for roads, potholes, and damaged sidewalks.",
  },
  {
    name: "Electricity",
    description: "Responsible for streetlights and traffic signals.",
  },
  {
    name: "Sanitation",
    description: "Responsible for garbage collection and blocked drains.",
  },
  {
    name: "Water Management",
    description: "Responsible for water leakage and water infrastructure.",
  },
];

const categories = [
  {
    name: "Potholes and Damaged Roads",
    description: "Potholes, broken roads, and damaged road surfaces.",
    department: "Roads / Works",
  },
  {
    name: "Broken Streetlights",
    description: "Non-functional or damaged streetlights.",
    department: "Electricity",
  },
  {
    name: "Garbage and Overflowing Waste Bins",
    description: "Uncollected garbage and overflowing public waste bins.",
    department: "Sanitation",
  },
  {
    name: "Water Leakage",
    description: "Leaking water pipes and water infrastructure.",
    department: "Water Management",
  },
  {
    name: "Damaged Sidewalks",
    description: "Broken, uneven, or damaged pedestrian sidewalks.",
    department: "Roads / Works",
  },
  {
    name: "Blocked Drains",
    description: "Blocked or overflowing public drainage systems.",
    department: "Sanitation",
  },
  {
    name: "Traffic-Signal Problems",
    description: "Faulty or non-functional traffic signals.",
    department: "Electricity",
  },
];

async function seedDatabase() {
  await connectDB();

  console.log("\nStarting Pukaar database seeding...\n");

  const departmentRecords = {};

  for (const department of departments) {
    const record = await prisma.department.upsert({
      where: { name: department.name },
      update: { description: department.description },
      create: department,
    });

    departmentRecords[record.name] = record;
    console.log(`Department ready: ${record.name}`);
  }

  for (const category of categories) {
    const { department, ...categoryData } = category;

    const categoryRecord = await prisma.issueCategory.upsert({
      where: { name: categoryData.name },
      update: { description: categoryData.description },
      create: categoryData,
    });

    const departmentRecord = departmentRecords[department];

    await prisma.routingRule.upsert({
      where: {
        categoryId_departmentId: {
          categoryId: categoryRecord.id,
          departmentId: departmentRecord.id,
        },
      },
      update: { isActive: true },
      create: {
        categoryId: categoryRecord.id,
        departmentId: departmentRecord.id,
        isActive: true,
      },
    });

    console.log(
      `Category ready: ${categoryRecord.name} -> ${department}`
    );
  }

  console.log("\nPukaar database seeding completed successfully!");
}

seedDatabase()
  .catch((error) => {
    console.error("\nDatabase seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
