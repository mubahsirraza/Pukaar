
const { prisma } = require("../config/db");

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const transactionOptions = {
  isolationLevel: "Serializable",
  maxWait: 5000,
  timeout: 10000,
};

// Get citizens with search, status filters and pagination.
const getAllCitizens = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status = req.query.status || "all";

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search cannot exceed 100 characters.",
      });
    }

    if (!["all", "active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be all, active, or inactive.",
      });
    }

    const where = {
      role: "CITIZEN",
      ...(status === "active" ? { isActive: true } : {}),
      ...(status === "inactive" ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [citizens, total, totalCitizens, activeCitizens, inactiveCitizens] =
      await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                reports: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        }),

        prisma.user.count({ where }),

        prisma.user.count({
          where: { role: "CITIZEN" },
        }),

        prisma.user.count({
          where: {
            role: "CITIZEN",
            isActive: true,
          },
        }),

        prisma.user.count({
          where: {
            role: "CITIZEN",
            isActive: false,
          },
        }),
      ]);

    return res.status(200).json({
      success: true,
      citizens,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalCitizens,
        activeCitizens,
        inactiveCitizens,
      },
    });
  } catch (error) {
    console.error("Get citizens error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve citizens.",
    });
  }
};

// Get one citizen with their submitted report history.
const getCitizenById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid citizen ID is required.",
      });
    }

    const citizen = await prisma.user.findFirst({
      where: {
        id,
        role: "CITIZEN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        reports: {
          select: {
            id: true,
            trackingCode: true,
            description: true,
            status: true,
            locationAddress: true,
            createdAt: true,
            updatedAt: true,
            verifiedAt: true,
            resolvedAt: true,
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
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            reports: true,
          },
        },
      },
    });

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: "Citizen not found.",
      });
    }

    return res.status(200).json({
      success: true,
      citizen,
    });
  } catch (error) {
    console.error("Get citizen error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve citizen details.",
    });
  }
};

// Activate or deactivate a citizen account.
const updateCitizenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid citizen ID is required.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const citizen = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: {
          id,
          role: "CITIZEN",
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      });

      if (!existing) {
        const error = new Error("CITIZEN_NOT_FOUND");
        throw error;
      }

      // Avoid unnecessary updates and duplicate audit records.
      if (existing.isActive === isActive) {
        return existing;
      }

      const updated = await tx.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "USER_UPDATED",
          entityType: "User",
          entityId: id,
          details: {
            name: existing.name,
            email: existing.email,
            previousStatus: existing.isActive,
            newStatus: isActive,
            change: isActive ? "ACTIVATED" : "DEACTIVATED",
          },
        },
      });

      return updated;
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: citizen.isActive
        ? "Citizen account activated successfully."
        : "Citizen account deactivated successfully.",
      citizen,
    });
  } catch (error) {
    console.error("Update citizen status error:", error);

    if (error.message === "CITIZEN_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Citizen not found.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "A concurrent change occurred. Please try again.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Citizen not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update citizen account status.",
    });
  }
};

module.exports = {
  getAllCitizens,
  getCitizenById,
  updateCitizenStatus,
};
