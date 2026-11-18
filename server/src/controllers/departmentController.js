
const { prisma } = require("../config/db");

// Get all departments.
const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
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
      (typeof description !== "string" || description.trim().length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text and cannot exceed 500 characters.",
      });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
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

    const department = await prisma.department.update({
      where: { id },
      data,
    });

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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
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

    const department = await prisma.department.update({
      where: { id },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Department activated successfully."
        : "Department deactivated successfully.",
      department,
    });
  } catch (error) {
    console.error("Update department status error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update department status.",
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
};
