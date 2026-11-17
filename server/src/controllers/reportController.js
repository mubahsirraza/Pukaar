
const crypto = require("crypto");
const { prisma } = require("../config/db");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");

// Check the actual image signature, not just its MIME type.
const isValidImage = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG
  const isJPEG =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG
  const isPNG =
    buffer.subarray(0, 8).equals(
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

// Submit a new citizen report.
const createReport = async (req, res) => {
  let uploadedImage = null;

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
        message: "Description is required and must not exceed 2000 characters.",
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
        message: "The uploaded file is not a valid JPG, PNG, or WEBP image.",
      });
    }

    // Upload photograph to Cloudinary.
    uploadedImage = await uploadToCloudinary(req.file.buffer);

    const trackingCode = generateTrackingCode();

    // Save report and initial status history together.
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
          status: "SUBMITTED",
          citizenId: req.user.id,
        },
      });

      await tx.statusHistory.create({
        data: {
          reportId: newReport.id,
          oldStatus: null,
          newStatus: "SUBMITTED",
          remarks: "Report submitted successfully.",
          changedBy: req.user.id,
        },
      });

      return newReport;
    });

    return res.status(201).json({
      success: true,
      message: "Your report has been submitted successfully.",
      report: {
        id: report.id,
        trackingCode: report.trackingCode,
        description: report.description,
        imageUrl: report.imageUrl,
        latitude: report.latitude,
        longitude: report.longitude,
        locationAddress: report.locationAddress,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("Report submission error:", error.message);

    // Remove the uploaded image if database saving fails.
    if (uploadedImage?.publicId) {
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
      message: "Report submission failed. Please try again.",
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