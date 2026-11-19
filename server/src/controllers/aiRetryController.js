
const { prisma } = require("../config/db");
const { classifyIssue } = require("../services/aiClassificationService");



// POST /api/admin/reports/:id/retry-ai
const retryAIClassification = async (req, res) => {
  let reportId = req.params.id;

  try {
    // Validate report UUID.
    if (
      typeof reportId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    // Find the report and its latest AI analysis.
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        aiAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    const latestAnalysis = report.aiAnalyses[0];

    // Only failed AI classifications can be retried.
    if (!latestAnalysis || latestAnalysis.status !== "FAILED") {
      return res.status(409).json({
        success: false,
        message: "Only reports with a failed latest AI analysis can be retried.",
      });
    }

    // Do not retry reports that have already progressed beyond review.
    if (report.status !== "PENDING_VERIFICATION") {
      return res.status(409).json({
        success: false,
        message: "This report is not eligible for AI retry.",
      });
    }

    if (!report.imageUrl || !report.description) {
      return res.status(400).json({
        success: false,
        message: "Report image or description is missing.",
      });
    }

    // Create a new pending analysis record to preserve history.
    const pendingAnalysis = await prisma.aIAnalysis.create({
      data: {
        reportId: report.id,
        suggestedCategory: "Potholes and Damaged Roads",
        suggestedSeverity: "LOW",
        confidence: 0,
        rationale: "AI retry is in progress.",
        status: "PENDING",
        modelName: "gemini-3.5-flash-lite",
      },
    });

    // Run Gemini classification again.
    let result;

    try {
      result = await classifyIssue({
        imageUrl: report.imageUrl,
        description: report.description,
      });
    } catch (aiError) {
      console.error("AI retry failed:", aiError.message);

      await prisma.aIAnalysis.update({
        where: { id: pendingAnalysis.id },
        data: {
          status: "FAILED",
          rationale: `Retry failed: ${aiError.message}`.slice(0, 1000),
        },
      });

      return res.status(502).json({
        success: false,
        message: "AI classification retry failed. The report remains available for manual administrator review.",
        reportId: report.id,
        analysisId: pendingAnalysis.id,
      });
    }

    // Save the successful AI recommendation.
    const completedAnalysis = await prisma.aIAnalysis.update({
      where: { id: pendingAnalysis.id },
      data: {
        suggestedCategory: result.suggestedCategory,
        suggestedSeverity: result.suggestedSeverity,
        confidence: result.confidence,
        rationale: result.rationale,
        modelName: result.modelName,
        status: "COMPLETED",
      },
    });

    // Keep report pending human verification.
    await prisma.$transaction([
      prisma.report.update({
        where: { id: report.id },
        data: { status: "PENDING_VERIFICATION" },
      }),

      prisma.statusHistory.create({
        data: {
          reportId: report.id,
          oldStatus: "PENDING_VERIFICATION",
          newStatus: "PENDING_VERIFICATION",
          remarks: "AI classification successfully retried. Awaiting administrator verification.",
          changedBy: req.user.id,
        },
      }),

      prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "REPORT_CORRECTED",
          entityType: "Report",
          entityId: report.id,
          details: {
            event: "AI_CLASSIFICATION_RETRIED",
            analysisId: completedAnalysis.id,
            suggestedCategory: result.suggestedCategory,
            suggestedSeverity: result.suggestedSeverity,
            confidence: result.confidence,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "AI classification retried successfully. Administrator verification is still required.",
      reportId: report.id,
      analysis: completedAnalysis,
    });
  } catch (error) {
    console.error("AI retry controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retry AI classification.",
    });
  }
};

module.exports = {
  retryAIClassification,
};
