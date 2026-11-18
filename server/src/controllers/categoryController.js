
const { prisma } = require("../config/db");

// Get all issue categories.
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.issueCategory.findMany({
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
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve issue categories.",
    });
  }
};

// Get one category by ID.
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category ID is required.",
      });
    }

    const category = await prisma.issueCategory.findUnique({
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

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Issue category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve issue category.",
    });
  }
};

// Create an issue category.
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot exceed 100 characters.",
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

    const category = await prisma.issueCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Issue category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An issue category with this name already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create issue category.",
    });
  }
};

// Update category details.
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category ID is required.",
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
          message: "Category name must contain 1–100 characters.",
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

    const category = await prisma.issueCategory.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Issue category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An issue category with this name already exists.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Issue category not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update issue category.",
    });
  }
};

// Activate or deactivate a category.
const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category ID is required.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const category = await prisma.issueCategory.update({
      where: { id },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Issue category activated successfully."
        : "Issue category deactivated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update category status error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Issue category not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category status.",
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};
