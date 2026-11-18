
const crypto = require("crypto");
const { prisma } = require("../config/db");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");
const { classifyIssue } = require("../services/aiClassificationService");

// Check the actual image signature, not just its MIME type.
const isValidImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG
  const isJPEG =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG
  const isPNG = buffer.subarray(0, 8).equals(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  );

  // WEBP
  const isWEBP =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  return isJPEG || isPNG || isWEBP;
};

// Generate a unique report tracking code.
const generateTrackingCode = () => {
  return `PUK-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

// Submit a new citizen report and perform AI classification.
const createReport = async (req, res) => {
  let uploadedImage = null;
  let reportSaved = false;

  try {
    const { description, latitude, longitude, locationAddress } =
      req.body;

    // Validate description.
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description is required and must not exceed 2000 characters.",
      });
    }

    // Validate GPS coordinates.
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === "" ||
      longitude === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid GPS coordinates.",
      });
    }

    // Require a photograph.
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Please upload an issue photograph.",
      });
    }

    // Verify the actual file signature.
    if (!isValidImage(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message:
          "The uploaded file is not a valid JPG, PNG, or WEBP image.",
      });
    }

    // Upload photograph to Cloudinary.
    uploadedImage = await uploadToCloudinary(req.file.buffer);

    const trackingCode = generateTrackingCode();

    // Save report, initial status history and pending AI analysis.
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          trackingCode,
          description: description.trim(),
          imageUrl: uploadedImage.url,
          latitude: lat,
          longitude: lng,
          locationAddress:
            typeof locationAddress === "string"
              ? locationAddress.trim().slice(0, 300) || null
              : null,
          status: "AI_PROCESSING",
          citizenId: req.user.id,
        },
      });

      // Record initial submission.
      await tx.statusHistory.create({
        data: {
          reportId: newReport.id,
          oldStatus: null,
          newStatus: "SUBMITTED",
          remarks: "Report submitted successfully.",
          changedBy: req.user.id,
        },
      });

      // Record transition to AI processing.
      await tx.statusHistory.create({
        data: {
          reportId: newReport.id,
          oldStatus: "SUBMITTED",
          newStatus: "AI_PROCESSING",
          remarks: "AI classification has started.",
          changedBy: null,
        },
      });

      // Create pending AI analysis record.
      const aiAnalysis = await tx.aIAnalysis.create({
        data: {
          reportId: newReport.id,
          suggestedCategory: "Pending classification",
          suggestedSeverity: "LOW",
          confidence: 0,
          rationale: "AI analysis is pending.",
          status: "PENDING",
        },
      });

      return {
        ...newReport,
        aiAnalysisId: aiAnalysis.id,
      };
    });

    // The report is safely stored.
    // Do not delete it if AI classification fails.
    reportSaved = true;

    let aiResult = null;
    let aiFailed = false;

    // Perform Gemini classification.
    try {
      aiResult = await classifyIssue({
        imageUrl: report.imageUrl,
        description: report.description,
      });

      // Save AI result and move report to human verification.
      await prisma.$transaction(async (tx) => {
        await tx.aIAnalysis.update({
          where: {
            id: report.aiAnalysisId,
          },
          data: {
            suggestedCategory: aiResult.suggestedCategory,
            suggestedSeverity: aiResult.suggestedSeverity,
            confidence: aiResult.confidence,
            rationale: aiResult.rationale,
            modelName: aiResult.modelName,
            status: "COMPLETED",
          },
        });

        await tx.report.update({
          where: {
            id: report.id,
          },
          data: {
            status: "PENDING_VERIFICATION",
          },
        });

        await tx.statusHistory.create({
          data: {
            reportId: report.id,
            oldStatus: "AI_PROCESSING",
            newStatus: "PENDING_VERIFICATION",
            remarks:
              "AI classification completed. Awaiting administrator verification.",
            changedBy: null,
          },
        });
      });
    } catch (aiError) {
      aiFailed = true;

      console.error(
        "AI classification failed:",
        aiError.status || "",
        aiError.message
      );

      // Preserve the report and send it for manual review.
      await prisma.$transaction(async (tx) => {
        await tx.aIAnalysis.update({
          where: {
            id: report.aiAnalysisId,
          },
          data: {
            status: "FAILED",
            rationale:
              "AI classification failed. Manual administrator review is required.",
          },
        });

        await tx.report.update({
          where: {
            id: report.id,
          },
          data: {
            status: "PENDING_VERIFICATION",
          },
        });

        await tx.statusHistory.create({
          data: {
            reportId: report.id,
            oldStatus: "AI_PROCESSING",
            newStatus: "PENDING_VERIFICATION",
            remarks:
              "AI classification unavailable. Report sent for manual verification.",
            changedBy: null,
          },
        });
      });
    }

    // Return the saved report and AI result.
    return res.status(201).json({
      success: true,
      message: aiFailed
        ? "Your report was submitted successfully. It will be reviewed manually."
        : "Your report was submitted and AI classification completed. It is awaiting administrator verification.",

      report: {
        id: report.id,
        trackingCode: report.trackingCode,
        description: report.description,
        imageUrl: report.imageUrl,
        latitude: report.latitude,
        longitude: report.longitude,
        locationAddress: report.locationAddress,
        status: "PENDING_VERIFICATION",
        createdAt: report.createdAt,
      },

      aiAnalysis: aiResult
        ? {
            suggestedCategory: aiResult.suggestedCategory,
            suggestedSeverity: aiResult.suggestedSeverity,
            confidence: aiResult.confidence,
            rationale: aiResult.rationale,
            status: "COMPLETED",
          }
        : {
            status: "FAILED",
            message: "Manual administrator review is required.",
          },
    });
  } catch (error) {
    console.error("Report submission error:", error.message);

    // Only remove the Cloudinary image if the report was never saved.
    if (!reportSaved && uploadedImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup error:",
          cleanupError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: reportSaved
        ? "Your report was saved, but processing encountered an error. Please contact the administrator."
        : "Report submission failed. Please try again.",
    });
  }
};

// Get all reports submitted by the logged-in citizen.
const getMyReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: {
        citizenId: req.user.id,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Fetch citizen reports error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your reports.",
    });
  }
};

// Get details and status history of one citizen-owned report.
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: {
        id,
        citizenId: req.user.id,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        statusHistory: {
          select: {
            oldStatus: true,
            newStatus: true,
            remarks: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
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
    console.error("Fetch report details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve report details.",
    });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportById,
};
