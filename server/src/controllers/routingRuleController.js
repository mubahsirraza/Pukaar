
const { prisma } = require("../config/db");

const isValidUUID = (id) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const transactionOptions = {
  isolationLevel: "Serializable",
  maxWait: 5000,
  timeout: 10000,
};

// Get all routing rules.
const getAllRoutingRules = async (req, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      orderBy: { createdAt: "asc" },
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

    const rule = await prisma.$transaction(async (tx) => {
      const [category, department] = await Promise.all([
        tx.issueCategory.findUnique({ where: { id: categoryId } }),
        tx.department.findUnique({ where: { id: departmentId } }),
      ]);

      if (!category || !department) {
        const error = new Error("CATEGORY_OR_DEPARTMENT_NOT_FOUND");
        throw error;
      }

      if (!category.isActive || !department.isActive) {
        const error = new Error("INACTIVE_CATEGORY_OR_DEPARTMENT");
        throw error;
      }

      const existingRule = await tx.routingRule.findUnique({
        where: {
          categoryId_departmentId: {
            categoryId,
            departmentId,
          },
        },
      });

      if (existingRule) {
        const error = new Error("DUPLICATE_ROUTING_RULE");
        throw error;
      }

      const activeRule = await tx.routingRule.findFirst({
        where: {
          categoryId,
          isActive: true,
        },
      });

      if (activeRule) {
        const error = new Error("CATEGORY_ALREADY_HAS_ACTIVE_RULE");
        throw error;
      }

      const created = await tx.routingRule.create({
        data: {
          categoryId,
          departmentId,
        },
        include: {
          category: true,
          department: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "ROUTING_RULE_CREATED",
          entityType: "RoutingRule",
          entityId: created.id,
          details: {
            categoryId,
            departmentId,
          },
        },
      });

      return created;
    }, transactionOptions);

    return res.status(201).json({
      success: true,
      message: "Routing rule created successfully.",
      rule,
    });
  } catch (error) {
    console.error("Create routing rule error:", error);

    if (error.message === "CATEGORY_OR_DEPARTMENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category or department not found.",
      });
    }

    if (error.message === "INACTIVE_CATEGORY_OR_DEPARTMENT") {
      return res.status(400).json({
        success: false,
        message: "Only active categories and departments can be assigned.",
      });
    }

    if (
      error.message === "DUPLICATE_ROUTING_RULE" ||
      error.message === "CATEGORY_ALREADY_HAS_ACTIVE_RULE" ||
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This category already has a matching rule or another active routing rule.",
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

    if (
      categoryId !== undefined && !isValidUUID(categoryId) ||
      departmentId !== undefined && !isValidUUID(departmentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid categoryId and departmentId are required.",
      });
    }

    const rule = await prisma.$transaction(async (tx) => {
      const currentRule = await tx.routingRule.findUnique({
        where: { id },
      });

      if (!currentRule) {
        const error = new Error("ROUTING_RULE_NOT_FOUND");
        throw error;
      }

      const newCategoryId = categoryId ?? currentRule.categoryId;
      const newDepartmentId = departmentId ?? currentRule.departmentId;

      const [category, department] = await Promise.all([
        tx.issueCategory.findUnique({
          where: { id: newCategoryId },
        }),
        tx.department.findUnique({
          where: { id: newDepartmentId },
        }),
      ]);

      if (!category || !department) {
        const error = new Error("CATEGORY_OR_DEPARTMENT_NOT_FOUND");
        throw error;
      }

      if (!category.isActive || !department.isActive) {
        const error = new Error("INACTIVE_CATEGORY_OR_DEPARTMENT");
        throw error;
      }

      // An active rule must not conflict with another active rule
      // assigned to the same category.
      if (currentRule.isActive) {
        const conflictingRule = await tx.routingRule.findFirst({
          where: {
            categoryId: newCategoryId,
            isActive: true,
            NOT: { id },
          },
        });

        if (conflictingRule) {
          const error = new Error("CATEGORY_ALREADY_HAS_ACTIVE_RULE");
          throw error;
        }
      }

      const updated = await tx.routingRule.update({
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

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "ROUTING_RULE_UPDATED",
          entityType: "RoutingRule",
          entityId: id,
          details: {
            oldCategoryId: currentRule.categoryId,
            oldDepartmentId: currentRule.departmentId,
            newCategoryId,
            newDepartmentId,
          },
        },
      });

      return updated;
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: "Routing rule updated successfully.",
      rule,
    });
  } catch (error) {
    console.error("Update routing rule error:", error);

    if (error.message === "ROUTING_RULE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Routing rule not found.",
      });
    }

    if (error.message === "CATEGORY_OR_DEPARTMENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Category or department not found.",
      });
    }

    if (error.message === "INACTIVE_CATEGORY_OR_DEPARTMENT") {
      return res.status(400).json({
        success: false,
        message: "Only active categories and departments can be assigned.",
      });
    }

    if (
      error.message === "CATEGORY_ALREADY_HAS_ACTIVE_RULE" ||
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "This category already has another active routing rule.",
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

    const updatedRule = await prisma.$transaction(async (tx) => {
      const rule = await tx.routingRule.findUnique({
        where: { id },
      });

      if (!rule) {
        const error = new Error("ROUTING_RULE_NOT_FOUND");
        throw error;
      }

      if (isActive) {
        const [category, department, existingRule] = await Promise.all([
          tx.issueCategory.findUnique({
            where: { id: rule.categoryId },
          }),
          tx.department.findUnique({
            where: { id: rule.departmentId },
          }),
          tx.routingRule.findFirst({
            where: {
              categoryId: rule.categoryId,
              isActive: true,
              NOT: { id },
            },
          }),
        ]);

        if (!category?.isActive || !department?.isActive) {
          const error = new Error("INACTIVE_CATEGORY_OR_DEPARTMENT");
          throw error;
        }

        if (existingRule) {
          const error = new Error("CATEGORY_ALREADY_HAS_ACTIVE_RULE");
          throw error;
        }
      }

      const updated = await tx.routingRule.update({
        where: { id },
        data: { isActive },
        include: {
          category: true,
          department: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user?.id || null,
          action: "ROUTING_RULE_UPDATED",
          entityType: "RoutingRule",
          entityId: id,
          details: {
            isActive,
          },
        },
      });

      return updated;
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Routing rule activated successfully."
        : "Routing rule deactivated successfully.",
      rule: updatedRule,
    });
  } catch (error) {
    console.error("Update routing rule status error:", error);

    if (error.message === "ROUTING_RULE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Routing rule not found.",
      });
    }

    if (error.message === "INACTIVE_CATEGORY_OR_DEPARTMENT") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot activate a rule for an inactive category or department.",
      });
    }

    if (error.message === "CATEGORY_ALREADY_HAS_ACTIVE_RULE") {
      return res.status(409).json({
        success: false,
        message:
          "Another active routing rule already exists for this category.",
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
