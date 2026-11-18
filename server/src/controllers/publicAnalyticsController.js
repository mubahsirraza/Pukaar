
const { prisma } = require("../config/db");

// Publicly visible report statuses
const PUBLIC_STATUSES = [
  "VERIFIED_AND_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
];

// GET /api/public/stats
const getPublicStats = async (req, res) => {
  try {
    const [
      totalVerified,
      open,
      inProgress,
      resolved,
    ] = await Promise.all([
      prisma.report.count({
        where: { status: { in: PUBLIC_STATUSES } },
      }),
      prisma.report.count({
        where: { status: "VERIFIED_AND_ASSIGNED" },
      }),
      prisma.report.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.report.count({
        where: { status: "RESOLVED" },
      }),
    ]);

    const resolutionRate =
      totalVerified > 0
        ? Number(((resolved / totalVerified) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      success: true,
      statistics: {
        totalVerified,
        open,
        inProgress,
        resolved,
        resolutionRate,
      },
    });
  } catch (error) {
    console.error("Get public stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public statistics.",
    });
  }
};

// GET /api/public/categories
const getPublicCategoryStats = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["categoryId"],
      where: {
        status: { in: PUBLIC_STATUSES },
        categoryId: { not: null },
      },
      _count: { _all: true },
    });

    const categories = await prisma.issueCategory.findMany({
      select: { id: true, name: true },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, category.name])
    );

    const data = results.map((item) => ({
      category: categoryMap.get(item.categoryId) || "Unknown",
      total: item._count._all,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get public category stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public category statistics.",
    });
  }
};

// GET /api/public/severity
const getPublicSeverityStats = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["verifiedSeverity"],
      where: {
        status: { in: PUBLIC_STATUSES },
        verifiedSeverity: { not: null },
      },
      _count: { _all: true },
    });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results.map((item) => ({
        severity: item.verifiedSeverity,
        total: item._count._all,
      })),
    });
  } catch (error) {
    console.error("Get public severity stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public severity statistics.",
    });
  }
};

// GET /api/public/trends?year=2026
const getPublicTrends = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year between 2000 and 2100.",
      });
    }

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    const reports = await prisma.report.findMany({
      where: {
        status: { in: PUBLIC_STATUSES },
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { createdAt: true },
    });

    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: new Date(Date.UTC(year, index, 1)).toLocaleString(
        "en-US",
        { month: "long", timeZone: "UTC" }
      ),
      total: 0,
    }));

    reports.forEach((report) => {
      monthlyData[report.createdAt.getUTCMonth()].total += 1;
    });

    res.status(200).json({
      success: true,
      year,
      data: monthlyData,
    });
  } catch (error) {
    console.error("Get public trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public reporting trends.",
    });
  }
};

// GET /api/public/hotspots
const getPublicHotspots = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: {
        status: { in: PUBLIC_STATUSES },
      },
      select: {
        latitude: true,
        longitude: true,
        categoryId: true,
        verifiedSeverity: true,
      },
    });

    // Group coordinates into approximate 0.01-degree grid cells.
    // Each cell represents an approximate area, not an exact report location.
    const grid = new Map();

    reports.forEach((report) => {
      const latitude = Number(report.latitude);
      const longitude = Number(report.longitude);

      const latCell = Math.floor(latitude * 100) / 100;
      const lngCell = Math.floor(longitude * 100) / 100;
      const key = `${latCell}:${lngCell}`;

      if (!grid.has(key)) {
        grid.set(key, {
          latitude: latCell + 0.005,
          longitude: lngCell + 0.005,
          total: 0,
          categories: new Map(),
          severity: {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
          },
        });
      }

      const cell = grid.get(key);
      cell.total += 1;

      if (report.categoryId) {
        cell.categories.set(
          report.categoryId,
          (cell.categories.get(report.categoryId) || 0) + 1
        );
      }

      if (report.verifiedSeverity) {
        cell.severity[report.verifiedSeverity] += 1;
      }
    });

    const categoryIds = [
      ...new Set(
        reports.map((report) => report.categoryId).filter(Boolean)
      ),
    ];

    const categories = await prisma.issueCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, category.name])
    );

    // Only return grid cells containing at least three verified reports.
    const hotspots = [...grid.values()]
      .filter((cell) => cell.total >= 3)
      .map((cell) => ({
        latitude: cell.latitude,
        longitude: cell.longitude,
        totalReports: cell.total,
        categories: [...cell.categories.entries()].map(
          ([categoryId, total]) => ({
            category: categoryMap.get(categoryId) || "Unknown",
            total,
          })
        ),
        severity: cell.severity,
      }));

    res.status(200).json({
      success: true,
      minimumReportsPerHotspot: 3,
      count: hotspots.length,
      data: hotspots,
    });
  } catch (error) {
    console.error("Get public hotspots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve public map hotspots.",
    });
  }
};

module.exports = {
  getPublicStats,
  getPublicCategoryStats,
  getPublicSeverityStats,
  getPublicTrends,
  getPublicHotspots,
};
