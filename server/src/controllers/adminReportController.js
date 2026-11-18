const { prisma } = require("../config/db");

const ALLOWED_STATUSES = [
  "SUBMITTED",
  "AI_PROCESSING",
  "PENDING_VERIFICATION",
  "VERIFIED_AND_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
];

// Get all reports for the administrator dashboard.
const getAllReports = async (req, res) => {
  try {
    const { status, categoryId, q } = req.query;

    // Validate status filter.
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status filter.",
      });
    }

    // Validate category ID filter.
    if (
      categoryId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    // Pagination.
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 10;

    const skip = (page - 1) * limit;

    // Build database filters.
    const where = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (typeof q === "string" && q.trim()) {
      const searchTerm = q.trim().slice(0, 100);

      where.OR = [
        {
          trackingCode: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    // Retrieve reports and total matching count.
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          aiAnalyses: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              suggestedCategory: true,
              suggestedSeverity: true,
              confidence: true,
              rationale: true,
              status: true,
              modelName: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.report.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      count: reports.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      reports,
    });
  } catch (error) {
    console.error("Admin report listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve reports.",
    });
  }
};

// Get complete details of an individual report for administrators.
const getAdminReportById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate report ID.
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    if (!isValidUUID) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    // Retrieve complete report information.
    const report = await prisma.report.findUnique({
      where: { id },

      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },

        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },

        aiAnalyses: {
          orderBy: {
            createdAt: "desc",
          },
        },

       statusHistory: {
  orderBy: {
    createdAt: "asc",
  },
},
        duplicateOf: {
          select: {
            id: true,
            trackingCode: true,
            status: true,
          },
        },

        duplicates: {
          select: {
            id: true,
            trackingCode: true,
            status: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Admin report detail error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve report details.",
    });
  }
};


// Verify a report and assign it to the responsible department.
const verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, severity, remarks } = req.body;

    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUUID) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const validSeverity = ["LOW", "MEDIUM", "HIGH"];

    if (
      !categoryId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId) ||
      !validSeverity.includes(severity)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category ID and severity are required.",
      });
    }

    if (
      remarks !== undefined &&
      (typeof remarks !== "string" || remarks.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be text with a maximum of 1000 characters.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id },
        include: {
          aiAnalyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!report) {
        return { error: "NOT_FOUND" };
      }

      if (report.status !== "PENDING_VERIFICATION") {
        return { error: "INVALID_STATUS" };
      }

      const category = await tx.issueCategory.findFirst({
        where: {
          id: categoryId,
          isActive: true,
        },
      });

      if (!category) {
        return { error: "INVALID_CATEGORY" };
      }

      const routingRules = await tx.routingRule.findMany({
        where: {
          categoryId,
          isActive: true,
          department: {
            isActive: true,
          },
        },
        include: {
          department: true,
        },
      });

      if (routingRules.length === 0) {
        return { error: "NO_ROUTING_RULE" };
      }

      if (routingRules.length > 1) {
        return { error: "AMBIGUOUS_ROUTING" };
      }

      const department = routingRules[0].department;
      const aiAnalysis = report.aiAnalyses[0];

      const isCorrection =
        aiAnalysis &&
        (
          aiAnalysis.suggestedCategory !== category.name ||
          aiAnalysis.suggestedSeverity !== severity
        );

      const updatedReport = await tx.report.update({
        where: { id },
        data: {
          categoryId,
          departmentId: department.id,
          verifiedSeverity: severity,
          verificationNotes: remarks?.trim() || null,
          status: "VERIFIED_AND_ASSIGNED",
          verifiedAt: new Date(),
        },
      });

      await tx.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: "PENDING_VERIFICATION",
          newStatus: "VERIFIED_AND_ASSIGNED",
          remarks: remarks?.trim() ||
            "Report verified and assigned to the responsible department.",
          changedBy: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: isCorrection ? "REPORT_CORRECTED" : "REPORT_VERIFIED",
          entityType: "Report",
          entityId: id,
          details: {
            category: category.name,
            severity,
            department: department.name,
            correctedAIRecommendation: Boolean(isCorrection),
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: "Your report has been verified",
          message: `Your report ${report.trackingCode} has been verified and assigned to ${department.name}.`,
          type: "REPORT_VERIFIED",
        },
      });

      return {
        report: updatedReport,
        category: category.name,
        department: department.name,
      };
    });

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        message: "Only reports awaiting verification can be verified.",
      });
    }

    if (result.error === "INVALID_CATEGORY") {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist or is inactive.",
      });
    }

    if (result.error === "NO_ROUTING_RULE") {
      return res.status(400).json({
        success: false,
        message: "No active department routing rule exists for this category.",
      });
    }

    if (result.error === "AMBIGUOUS_ROUTING") {
      return res.status(409).json({
        success: false,
        message: "Multiple active departments are configured for this category. Please resolve the routing configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report verified and assigned successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Report verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify and assign report.",
    });
  }
};


// Reject a report with a mandatory reason.
const rejectReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate report ID.
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isValidUUID) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    // Rejection reason is mandatory.
    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required (maximum 1000 characters).",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id },
      });

      if (!report) {
        return { error: "NOT_FOUND" };
      }

      if (report.status !== "PENDING_VERIFICATION") {
        return { error: "INVALID_STATUS" };
      }

      const rejectionReason = reason.trim();

      const updatedReport = await tx.report.update({
        where: { id },
        data: {
          status: "REJECTED",
          verificationNotes: rejectionReason,
        },
      });

      await tx.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: "PENDING_VERIFICATION",
          newStatus: "REJECTED",
          remarks: rejectionReason,
          changedBy: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "REPORT_REJECTED",
          entityType: "Report",
          entityId: id,
          details: {
            trackingCode: report.trackingCode,
            rejectionReason,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: "Your report has been rejected",
          message: `Your report ${report.trackingCode} was rejected. Reason: ${rejectionReason}`,
          type: "REPORT_REJECTED",
        },
      });

      return { report: updatedReport };
    });

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (result.error === "INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        message: "Only reports awaiting verification can be rejected.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report rejected successfully.",
      report: result.report,
    });
  } catch (error) {
    console.error("Report rejection error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reject report.",
    });
  }
};


// Mark a report as a duplicate of another existing report.
const markReportAsDuplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalReportId, remarks } = req.body;

    // Validate report IDs.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(originalReportId || "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid report IDs are required.",
      });
    }

    if (id === originalReportId) {
      return res.status(400).json({
        success: false,
        message: "A report cannot be marked as a duplicate of itself.",
      });
    }

    const duplicateRemarks =
      typeof remarks === "string" ? remarks.trim() : "";

    if (duplicateRemarks.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Remarks cannot exceed 1000 characters.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id },
      });

      if (!report) {
        const error = new Error("Report not found.");
        error.code = "NOT_FOUND";
        throw error;
      }

      if (report.status !== "PENDING_VERIFICATION") {
        const error = new Error(
          "Only reports pending verification can be marked as duplicates."
        );
        error.code = "INVALID_STATUS";
        throw error;
      }

      const originalReport = await tx.report.findUnique({
        where: { id: originalReportId },
      });

      if (!originalReport) {
        const error = new Error("Original report not found.");
        error.code = "ORIGINAL_NOT_FOUND";
        throw error;
      }

      if (
        originalReport.status === "DUPLICATE" ||
        originalReport.status === "REJECTED"
      ) {
        const error = new Error(
          "The original report must not be rejected or another duplicate."
        );
        error.code = "INVALID_ORIGINAL";
        throw error;
      }

      const updatedReport = await tx.report.update({
        where: { id },
        data: {
          status: "DUPLICATE",
          duplicateOfId: originalReportId,
          verificationNotes: duplicateRemarks || "Marked as a duplicate report.",
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      await tx.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: "DUPLICATE",
          remarks: duplicateRemarks || "Marked as a duplicate report.",
          changedBy: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "REPORT_MARKED_DUPLICATE",
          entityType: "Report",
          entityId: id,
          details: {
            trackingCode: report.trackingCode,
            originalReportId,
            originalTrackingCode: originalReport.trackingCode,
            remarks: duplicateRemarks || null,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: "Your report has been marked as a duplicate",
          message: `Your report ${report.trackingCode} has been linked to original report ${originalReport.trackingCode}.`,
          type: "STATUS_UPDATE",
        },
      });

      return updatedReport;
    });

    return res.status(200).json({
      success: true,
      message: "Report marked as duplicate successfully.",
      report: result,
    });
  } catch (error) {
    console.error("Mark duplicate report error:", error);

    const statusCodes = {
      NOT_FOUND: 404,
      ORIGINAL_NOT_FOUND: 404,
      INVALID_STATUS: 400,
      INVALID_ORIGINAL: 400,
    };

    return res.status(statusCodes[error.code] || 500).json({
      success: false,
      message: error.message || "Failed to mark report as duplicate.",
    });
  }
};


const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid report ID is required.",
      });
    }

    if (!["IN_PROGRESS", "RESOLVED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be IN_PROGRESS or RESOLVED.",
      });
    }

    const statusRemarks =
      typeof remarks === "string" ? remarks.trim() : "";

    if (statusRemarks.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Remarks cannot exceed 1000 characters.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id },
      });

      if (!report) {
        const error = new Error("Report not found.");
        error.code = "NOT_FOUND";
        throw error;
      }

      // Only verified and assigned reports can enter IN_PROGRESS.
      if (
        status === "IN_PROGRESS" &&
        report.status !== "VERIFIED_AND_ASSIGNED"
      ) {
        const error = new Error(
          "Only verified and assigned reports can be moved to IN_PROGRESS."
        );
        error.code = "INVALID_STATUS";
        throw error;
      }

      // Only reports currently in progress can be resolved.
      if (
        status === "RESOLVED" &&
        report.status !== "IN_PROGRESS"
      ) {
        const error = new Error(
          "Only reports currently IN_PROGRESS can be marked as RESOLVED."
        );
        error.code = "INVALID_STATUS";
        throw error;
      }

      const updatedReport = await tx.report.update({
        where: { id },
        data: {
          status,
          ...(status === "RESOLVED"
            ? { resolvedAt: new Date() }
            : {}),
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
          department: true,
        },
      });

      await tx.statusHistory.create({
        data: {
          reportId: id,
          oldStatus: report.status,
          newStatus: status,
          remarks: statusRemarks || null,
          changedBy: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "STATUS_CHANGED",
          entityType: "Report",
          entityId: id,
          details: {
            trackingCode: report.trackingCode,
            oldStatus: report.status,
            newStatus: status,
            remarks: statusRemarks || null,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title:
            status === "RESOLVED"
              ? "Your report has been resolved"
              : "Your report is now in progress",
          message:
            status === "RESOLVED"
              ? `Your report ${report.trackingCode} has been marked as resolved.`
              : `Work has started on your report ${report.trackingCode}.`,
          type:
            status === "RESOLVED"
              ? "REPORT_RESOLVED"
              : "STATUS_UPDATE",
        },
      });

      return updatedReport;
    });

    return res.status(200).json({
      success: true,
      message:
        status === "RESOLVED"
          ? "Report marked as resolved successfully."
          : "Report moved to IN_PROGRESS successfully.",
      report: result,
    });
  } catch (error) {
    console.error("Update report status error:", error);

    const statusCodes = {
      NOT_FOUND: 404,
      INVALID_STATUS: 400,
    };

    return res.status(statusCodes[error.code] || 500).json({
      success: false,
      message: error.message || "Failed to update report status.",
    });
  }
};


module.exports = {
  getAllReports,
  getAdminReportById,
  verifyReport,
  rejectReport,
  markReportAsDuplicate,
  updateReportStatus,


};
