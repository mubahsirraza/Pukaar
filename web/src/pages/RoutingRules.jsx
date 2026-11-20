
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Plus,
  Search,
  Pencil,
  Power,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Tags,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  categoryId: "",
  departmentId: "",
};

export default function RoutingRules() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingRuleId, setUpdatingRuleId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [rulesResponse, categoriesResponse, departmentsResponse] =
        await Promise.all([
          api.get("/admin/routing-rules"),
          api.get("/admin/categories"),
          api.get("/admin/departments"),
        ]);

      setRules(
        Array.isArray(rulesResponse.data?.rules)
          ? rulesResponse.data.rules
          : []
      );

      setCategories(
        Array.isArray(categoriesResponse.data?.categories)
          ? categoriesResponse.data.categories
          : []
      );

      setDepartments(
        Array.isArray(departmentsResponse.data?.departments)
          ? departmentsResponse.data.departments
          : []
      );
    } catch (err) {
      console.error("Failed to load routing rules:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load routing rules. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.isActive),
    [departments]
  );

  const stats = useMemo(() => {
    const active = rules.filter((rule) => rule.isActive).length;
    const inactive = rules.length - active;

    const categoriesCovered = new Set(
      rules
        .filter((rule) => rule.isActive)
        .map((rule) => rule.categoryId)
    ).size;

    return {
      total: rules.length,
      active,
      inactive,
      categoriesCovered,
    };
  }, [rules]);

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !term ||
        rule.category?.name?.toLowerCase().includes(term) ||
        rule.department?.name?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rule.isActive) ||
        (statusFilter === "INACTIVE" && !rule.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [rules, search, statusFilter]);

  const openCreateModal = () => {
    setEditingRule(null);
    setForm({
      ...emptyForm,
      categoryId: activeCategories[0]?.id || "",
      departmentId: activeDepartments[0]?.id || "",
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setForm({
      categoryId: rule.categoryId,
      departmentId: rule.departmentId,
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRule(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.categoryId || !form.departmentId) {
      setError("Please select both an issue category and a department.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingRule) {
        await api.patch(`/admin/routing-rules/${editingRule.id}`, form);
        showNotice("Routing rule updated successfully.");
      } else {
        await api.post("/admin/routing-rules", form);
        showNotice("Routing rule created successfully.");
      }

      setModalOpen(false);
      setEditingRule(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      console.error("Failed to save routing rule:", err);
      setError(
        err.response?.data?.message ||
          "Unable to save the routing rule. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (rule) => {
    if (updatingRuleId) return;

    const nextStatus = !rule.isActive;
    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} the routing rule "${rule.category?.name || "Category"} → ${rule.department?.name || "Department"}"?`
    );

    if (!confirmed) return;

    setError("");
    setUpdatingRuleId(rule.id);

    try {
      await api.patch(`/admin/routing-rules/${rule.id}/status`, {
        isActive: nextStatus,
      });

      showNotice(
        nextStatus
          ? "Routing rule activated successfully."
          : "Routing rule deactivated successfully."
      );

      await loadData();
    } catch (err) {
      console.error("Failed to update routing rule status:", err);
      setError(
        err.response?.data?.message ||
          "Unable to update routing rule status."
      );
    } finally {
      setUpdatingRuleId(null);
    }
  };

  const filterButtons = [
    {
      value: "ALL",
      label: "All Rules",
      count: stats.total,
    },
    {
      value: "ACTIVE",
      label: "Active",
      count: stats.active,
    },
    {
      value: "INACTIVE",
      label: "Inactive",
      count: stats.inactive,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <GitBranch size={22} />
            </div>
            <h1 className="text-2xl font-bold text-[#10243E]">
              Routing Rules
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Assign issue categories to the departments responsible for handling
            them.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            disabled={!activeCategories.length || !activeDepartments.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Create Routing Rule
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Rules"
          value={stats.total}
          icon={<GitBranch size={20} />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active Rules"
          value={stats.active}
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-green-50 text-green-600"
        />
        <StatCard
          label="Inactive Rules"
          value={stats.inactive}
          icon={<XCircle size={20} />}
          iconClass="bg-gray-100 text-gray-600"
        />
        <StatCard
          label="Categories Covered"
          value={stats.categoriesCovered}
          icon={<Tags size={20} />}
          iconClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Availability information */}
      {(!activeCategories.length || !activeDepartments.length) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {!activeCategories.length && !activeDepartments.length
            ? "There are no active categories or departments available. Activate at least one of each before creating a routing rule."
            : !activeCategories.length
              ? "There are no active issue categories. Activate a category before creating a routing rule."
              : "There are no active departments. Activate a department before creating a routing rule."}
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by category or department..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Visible Active / Inactive filter buttons */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[#10243E]">
            Filter Routing Rules
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Choose which routing rules you want to view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => {
            const selected = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? filter.value === "ACTIVE"
                      ? "border-green-600 bg-green-600 text-white shadow-sm"
                      : filter.value === "INACTIVE"
                        ? "border-gray-600 bg-gray-700 text-white shadow-sm"
                        : "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {filter.value === "ACTIVE" && <CheckCircle2 size={16} />}
                {filter.value === "INACTIVE" && <XCircle size={16} />}
                {filter.value === "ALL" && <GitBranch size={16} />}
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routing rules table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#10243E]">
              {statusFilter === "ACTIVE"
                ? "Active Routing Rules"
                : statusFilter === "INACTIVE"
                  ? "Inactive Routing Rules"
                  : "All Category Assignments"}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredRules.length}{" "}
              {filteredRules.length === 1 ? "rule" : "rules"} found
            </p>
          </div>
          <GitBranch size={20} className="text-gray-400" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading routing rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <GitBranch size={22} />
            </div>
            <h3 className="font-semibold text-gray-800">
              {rules.length === 0
                ? "No routing rules yet"
                : "No matching rules"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {rules.length === 0
                ? "Create your first rule to connect an issue category with a department."
                : "Try another filter or change your search."}
            </p>
            {rules.length === 0 && (
              <button
                onClick={openCreateModal}
                disabled={!activeCategories.length || !activeDepartments.length}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus size={16} />
                Create first rule
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Issue Category</th>
                  <th className="px-4 py-3 font-semibold">Assigned Department</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="transition hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                          <Tags size={17} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {rule.category?.name || "Unknown category"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {rule.category?.isActive
                              ? "Category active"
                              : "Category inactive"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <ArrowRight size={15} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-800">
                            {rule.department?.name || "Unknown department"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {rule.department?.isActive
                              ? "Department active"
                              : "Department inactive"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {rule.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-500">
                      {rule.createdAt
                        ? new Date(rule.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          title="Edit routing rule"
                          disabled={!!updatingRuleId}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleStatusChange(rule)}
                          title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                          disabled={!!updatingRuleId}
                          className={`rounded-lg p-2 transition disabled:opacity-50 ${
                            rule.isActive
                              ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
                              : "text-gray-500 hover:bg-green-50 hover:text-green-600"
                          }`}
                        >
                          {updatingRuleId === rule.id ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <Power size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-[#10243E]">
                  {editingRule ? "Edit Routing Rule" : "Create Routing Rule"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Connect an issue category to its responsible department.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Issue Category
                </label>
                <div className="relative">
                  <Tags
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    required
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        categoryId: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select an issue category</option>
                    {categories
                      .filter(
                        (category) =>
                          category.isActive ||
                          (editingRule && category.id === form.categoryId)
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                          {!category.isActive ? " (Inactive)" : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Only active categories can be assigned.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Responsible Department
                </label>
                <div className="relative">
                  <Building2
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    required
                    value={form.departmentId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        departmentId: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a department</option>
                    {departments
                      .filter(
                        (department) =>
                          department.isActive ||
                          (editingRule && department.id === form.departmentId)
                      )
                      .map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                          {!department.isActive ? " (Inactive)" : ""}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Only active departments can be assigned.
                </p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <div className="flex items-center gap-2 font-medium">
                  <GitBranch size={16} />
                  Routing preview
                </div>
                <p className="mt-1 text-blue-700">
                  {categories.find((item) => item.id === form.categoryId)?.name ||
                    "Selected category"}
                  {" → "}
                  {departments.find((item) => item.id === form.departmentId)?.name ||
                    "Selected department"}
                </p>
                <p className="mt-2 text-xs text-blue-600">
                  Only one active routing rule is allowed per issue category.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !form.categoryId || !form.departmentId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingRule
                      ? "Save Changes"
                      : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, iconClass }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#10243E]">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}
