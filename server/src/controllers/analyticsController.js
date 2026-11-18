
const { prisma } = require("../config/db");

// GET /api/admin/analytics/overview
const getOverviewStats = async (req, res) => {
  try {
    const [
      totalReports,
      pendingVerification,
      verifiedAndAssigned,
      inProgress,
      resolved,
      rejected,
      duplicate,
      submitted,
      aiProcessing,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.report.count({ where: { status: "VERIFIED_AND_ASSIGNED" } }),
      prisma.report.count({ where: { status: "IN_PROGRESS" } }),
      prisma.report.count({ where: { status: "RESOLVED" } }),
      prisma.report.count({ where: { status: "REJECTED" } }),
      prisma.report.count({ where: { status: "DUPLICATE" } }),
      prisma.report.count({ where: { status: "SUBMITTED" } }),
      prisma.report.count({ where: { status: "AI_PROCESSING" } }),
    ]);

    const resolutionRate =
      totalReports > 0
        ? Number(((resolved / totalReports) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      success: true,
      overview: {
        totalReports,
        pendingVerification,
        verifiedAndAssigned,
        inProgress,
        resolved,
        rejected,
        duplicate,
        submitted,
        aiProcessing,
        resolutionRate,
      },
    });
  } catch (error) {
    console.error("Get overview stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve overview statistics.",
    });
  }
};

// GET /api/admin/analytics/by-status
const getReportsByStatus = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    });

    res.status(200).json({
      success: true,
      count: results.length,
      data: results.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
    });
  } catch (error) {
    console.error("Get reports by status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve report status statistics.",
    });
  }
};

// GET /api/admin/analytics/by-category
const getReportsByCategory = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["categoryId"],
      where: { categoryId: { not: null } },
      _count: { _all: true },
    });

    const categories = await prisma.issueCategory.findMany({
      select: { id: true, name: true },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, category.name])
    );

    const data = results.map((item) => ({
      categoryId: item.categoryId,
      category: categoryMap.get(item.categoryId) || "Unknown",
      total: item._count._all,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get reports by category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve category statistics.",
    });
  }
};

// GET /api/admin/analytics/by-severity
const getReportsBySeverity = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["verifiedSeverity"],
      where: { verifiedSeverity: { not: null } },
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
    console.error("Get reports by severity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve severity statistics.",
    });
  }
};

// GET /api/admin/analytics/by-department
const getReportsByDepartment = async (req, res) => {
  try {
    const results = await prisma.report.groupBy({
      by: ["departmentId"],
      where: { departmentId: { not: null } },
      _count: { _all: true },
    });

    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });

    const departmentMap = new Map(
      departments.map((department) => [department.id, department.name])
    );

    const data = results.map((item) => ({
      departmentId: item.departmentId,
      department: departmentMap.get(item.departmentId) || "Unknown",
      total: item._count._all,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get reports by department error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve department statistics.",
    });
  }
};

// GET /api/admin/analytics/monthly
const getMonthlyReportTrends = async (req, res) => {
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
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { createdAt: true },
    });

    const monthlyCounts = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: new Date(Date.UTC(year, index, 1)).toLocaleString(
        "en-US",
        { month: "long", timeZone: "UTC" }
      ),
      total: 0,
    }));

    reports.forEach((report) => {
      const month = report.createdAt.getUTCMonth();
      monthlyCounts[month].total += 1;
    });

    res.status(200).json({
      success: true,
      year,
      data: monthlyCounts,
    });
  } catch (error) {
    console.error("Get monthly report trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly report trends.",
    });
  }
};

// GET /api/admin/analytics/resolution
const getResolutionMetrics = async (req, res) => {
  try {
    const [totalReports, resolvedReports] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({
        where: {
          status: "RESOLVED",
          resolvedAt: { not: null },
        },
      }),
    ]);

    const resolutionRate =
      totalReports > 0
        ? Number(((resolvedReports / totalReports) * 100).toFixed(2))
        : 0;

    const resolvedRecords = await prisma.report.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const averageResolutionTimeHours =
      resolvedRecords.length > 0
        ? Number(
            (
              resolvedRecords.reduce((sum, report) => {
                return (
                  sum +
                  (report.resolvedAt.getTime() - report.createdAt.getTime()) /
                    (1000 * 60 * 60)
                );
              }, 0) / resolvedRecords.length
            ).toFixed(2)
          )
        : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalReports,
        resolvedReports,
        resolutionRate,
        averageResolutionTimeHours,
      },
    });
  } catch (error) {
    console.error("Get resolution metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve resolution metrics.",
    });
  }
};

module.exports = {
  getOverviewStats,
  getReportsByStatus,
  getReportsByCategory,
  getReportsBySeverity,
  getReportsByDepartment,
  getMonthlyReportTrends,
  getResolutionMetrics,
};
