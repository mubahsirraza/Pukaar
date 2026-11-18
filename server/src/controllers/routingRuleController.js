
const { prisma } = require("../config/db");

const isValidUUID = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Get all routing rules.
const getAllRoutingRules = async (req, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        category: true,
        department: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (error) {
    console.error("Get routing rules error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve routing rules.",
    });
  }
};

// Get one routing rule.
const getRoutingRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid routing rule ID is required.",
      });
    }

    const rule = await prisma.routingRule.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Routing rule not found.",
      });
    }

    return res.status(200).json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error("Get routing rule error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve routing rule.",
    });
  }
};

// Create a routing rule.
const createRoutingRule = async (req, res) => {
  try {
    const { categoryId, departmentId } = req.body;

    if (!isValidUUID(categoryId) || !isValidUUID(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid categoryId and departmentId are required.",
      });
    }

    const [category, department] = await Promise.all([
      prisma.issueCategory.findUnique({ where: { id: categoryId } }),
      prisma.department.findUnique({ where: { id: departmentId } }),
    ]);

    if (!category || !department) {
      return res.status(404).json({
        success: false,
        message: "Category or department not found.",
      });
    }

    if (!category.isActive || !department.isActive) {
      return res.status(400).json({
        success: false,
        message: "Only active categories and departments can be assigned.",
      });
    }

    const existingRule = await prisma.routingRule.findUnique({
      where: {
        categoryId_departmentId: {
          categoryId,
          departmentId,
        },
      },
    });

    if (existingRule) {
      return res.status(409).json({
        success: false,
        message: "This category-to-department routing rule already exists.",
      });
    }

    const activeRule = await prisma.routingRule.findFirst({
      where: {
        categoryId,
        isActive: true,
      },
    });

    if (activeRule) {
      return res.status(409).json({
        success: false,
        message: "This category already has an active routing rule. Deactivate or update it first.",
      });
    }

    const rule = await prisma.routingRule.create({
      data: {
        categoryId,
        departmentId,
      },
      include: {
        category: true,
        department: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Routing rule created successfully.",
      rule,
    });
  } catch (error) {
    console.error("Create routing rule error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This routing rule already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create routing rule.",
    });
  }
};

// Update a routing rule.
const updateRoutingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, departmentId } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid routing rule ID is required.",
      });
    }

    if (categoryId === undefined && departmentId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide categoryId or departmentId to update.",
      });
    }

    const currentRule = await prisma.routingRule.findUnique({
      where: { id },
    });

    if (!currentRule) {
      return res.status(404).json({
        success: false,
        message: "Routing rule not found.",
      });
    }

    const newCategoryId = categoryId ?? currentRule.categoryId;
    const newDepartmentId = departmentId ?? currentRule.departmentId;

    if (
      !isValidUUID(newCategoryId) ||
      !isValidUUID(newDepartmentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid categoryId and departmentId are required.",
      });
    }

    const [category, department] = await Promise.all([
      prisma.issueCategory.findUnique({
        where: { id: newCategoryId },
      }),
      prisma.department.findUnique({
        where: { id: newDepartmentId },
      }),
    ]);

    if (!category || !department) {
      return res.status(404).json({
        success: false,
        message: "Category or department not found.",
      });
    }

    if (!category.isActive || !department.isActive) {
      return res.status(400).json({
        success: false,
        message: "Only active categories and departments can be assigned.",
      });
    }

    if (currentRule.isActive) {
      const conflictingRule = await prisma.routingRule.findFirst({
        where: {
          categoryId: newCategoryId,
          isActive: true,
          NOT: { id },
        },
      });

      if (conflictingRule) {
        return res.status(409).json({
          success: false,
          message: "This category already has another active routing rule.",
        });
      }
    }

    const rule = await prisma.routingRule.update({
      where: { id },
      data: {
        categoryId: newCategoryId,
        departmentId: newDepartmentId,
      },
      include: {
        category: true,
        department: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Routing rule updated successfully.",
      rule,
    });
  } catch (error) {
    console.error("Update routing rule error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This routing rule already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update routing rule.",
    });
  }
};

// Activate or deactivate a routing rule.
const updateRoutingRuleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid routing rule ID is required.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const rule = await prisma.routingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Routing rule not found.",
      });
    }

    if (isActive) {
      const [category, department, existingRule] = await Promise.all([
        prisma.issueCategory.findUnique({
          where: { id: rule.categoryId },
        }),
        prisma.department.findUnique({
          where: { id: rule.departmentId },
        }),
        prisma.routingRule.findFirst({
          where: {
            categoryId: rule.categoryId,
            isActive: true,
            NOT: { id },
          },
        }),
      ]);

      if (!category?.isActive || !department?.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot activate a rule for an inactive category or department.",
        });
      }

      if (existingRule) {
        return res.status(409).json({
          success: false,
          message: "Another active routing rule already exists for this category.",
        });
      }
    }

    const updatedRule = await prisma.routingRule.update({
      where: { id },
      data: { isActive },
      include: {
        category: true,
        department: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Routing rule activated successfully."
        : "Routing rule deactivated successfully.",
      rule: updatedRule,
    });
  } catch (error) {
    console.error("Update routing rule status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update routing rule status.",
    });
  }
};

module.exports = {
  getAllRoutingRules,
  getRoutingRuleById,
  createRoutingRule,
  updateRoutingRule,
  updateRoutingRuleStatus,
};
