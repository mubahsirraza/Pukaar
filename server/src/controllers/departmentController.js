
const { prisma } = require("../config/db");

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const transactionOptions = {
  isolationLevel: "Serializable",
  maxWait: 5000,
  timeout: 10000,
};

// Get all departments.
const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            reports: true,
            routingRules: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve departments.",
    });
  }
};

// Get one department by ID.
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid department ID is required.",
      });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reports: true,
            routingRules: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    return res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Get department error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve department.",
    });
  }
};

// Create a department.
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Department name cannot exceed 100 characters.",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" ||
        description.trim().length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text and cannot exceed 500 characters.",
      });
    }

    const department = await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "DEPARTMENT_CREATED",
          entityType: "Department",
          entityId: created.id,
          details: {
            name: created.name,
          },
        },
      });

      return created;
    }, transactionOptions);

    return res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    console.error("Create department error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A department with this name already exists.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "A concurrent change occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create department.",
    });
  }
};

// Update department details.
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid department ID is required.",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Department name must contain 1–100 characters.",
        });
      }

      data.name = name.trim();
    }

    if (description !== undefined) {
      if (
        description !== null &&
        (typeof description !== "string" ||
          description.trim().length > 500)
      ) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 500 characters.",
        });
      }

      data.description = description?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const department = await prisma.$transaction(async (tx) => {
      const updated = await tx.department.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "DEPARTMENT_UPDATED",
          entityType: "Department",
          entityId: id,
          details: data,
        },
      });

      return updated;
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    console.error("Update department error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A department with this name already exists.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "A concurrent change occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update department.",
    });
  }
};

// Activate or deactivate a department.
const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid department ID is required.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const department = await prisma.$transaction(async (tx) => {
      const existing = await tx.department.findUnique({
        where: { id },
      });

      if (!existing) {
        const error = new Error("DEPARTMENT_NOT_FOUND");
        throw error;
      }

      const updated = await tx.department.update({
        where: { id },
        data: { isActive },
      });

      // When deactivating a department, also deactivate
      // all its active routing rules.
      let deactivatedRules = 0;

      if (!isActive) {
        const result = await tx.routingRule.updateMany({
          where: {
            departmentId: id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        deactivatedRules = result.count;
      }

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: isActive
            ? "DEPARTMENT_ACTIVATED"
            : "DEPARTMENT_DEACTIVATED",
          entityType: "Department",
          entityId: id,
          details: {
            name: updated.name,
            isActive,
            deactivatedRules,
          },
        },
      });

      return {
        ...updated,
        deactivatedRules,
      };
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Department activated successfully."
        : "Department deactivated successfully. Its active routing rules were also deactivated.",
      department,
    });
  } catch (error) {
    console.error("Update department status error:", error);

    if (error.message === "DEPARTMENT_NOT_FOUND" || error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "A concurrent change occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update department status.",
    });
  }
};

// Delete a department only when it has no related records.
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid department ID is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              reports: true,
              routingRules: true,
            },
          },
        },
      });

      if (!department) {
        const error = new Error("DEPARTMENT_NOT_FOUND");
        throw error;
      }

      const { reports, routingRules } = department._count;

      if (reports > 0 || routingRules > 0) {
        const error = new Error("DEPARTMENT_HAS_LINKED_RECORDS");
        error.relatedRecords = { reports, routingRules };
        throw error;
      }

      // Foreign-key constraints provide an additional safeguard.
      await tx.department.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "DEPARTMENT_DELETED",
          entityType: "Department",
          entityId: id,
          details: {
            name: department.name,
          },
        },
      });

      return department;
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully.",
      departmentId: result.id,
    });
  } catch (error) {
    console.error("Delete department error:", error);

    if (error.message === "DEPARTMENT_NOT_FOUND" || error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (error.message === "DEPARTMENT_HAS_LINKED_RECORDS") {
      return res.status(409).json({
        success: false,
        message:
          "This department cannot be deleted because it is linked to existing records. Deactivate it instead.",
        relatedRecords: error.relatedRecords,
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message:
          "This department is linked to other records and cannot be deleted. Deactivate it instead.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "A concurrent change occurred. Refresh the departments list and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete department.",
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
};
