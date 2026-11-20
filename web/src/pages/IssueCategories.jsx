
import { useEffect, useMemo, useState } from "react";
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  ClipboardList,
  GitBranch,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import api from "../services/api";

const getCategories = (data) =>
  Array.isArray(data?.categories) ? data.categories : [];

const getCounts = (category) => ({
  reports: category?._count?.reports ?? 0,
  routingRules: category?._count?.routingRules ?? 0,
});

export default function IssueCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const fetchCategories = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await api.get("/admin/categories");
      setCategories(getCategories(response.data));
    } catch (err) {
      console.error("Fetch categories error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load issue categories."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const stats = useMemo(() => {
    const active = categories.filter((item) => item.isActive).length;

    return {
      total: categories.length,
      active,
      inactive: categories.length - active,
      reports: categories.reduce(
        (sum, item) => sum + getCounts(item).reports,
        0
      ),
      rules: categories.reduce(
        (sum, item) => sum + getCounts(item).routingRules,
        0
      ),
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        category.name?.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && category.isActive) ||
        (statusFilter === "INACTIVE" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const filterButtons = [
    { value: "ALL", label: "All Categories", count: stats.total },
    { value: "ACTIVE", label: "Active", count: stats.active },
    { value: "INACTIVE", label: "Inactive", count: stats.inactive },
  ];

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      showNotice("error", "Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        description: description || null,
      };

      if (editingCategory) {
        await api.patch(
          `/admin/categories/${editingCategory.id}`,
          payload
        );
        showNotice("success", "Category updated successfully.");
      } else {
        await api.post("/admin/categories", payload);
        showNotice("success", "Category created successfully.");
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });

      await fetchCategories(true);
    } catch (err) {
      console.error("Save category error:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (category) => {
    if (statusUpdatingId) return;

    const nextStatus = !category.isActive;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate "${category.name}"?`
        : `Deactivate "${category.name}"? It will no longer be available for new report assignments.`
    );

    if (!confirmed) return;

    try {
      setStatusUpdatingId(category.id);

      await api.patch(
        `/admin/categories/${category.id}/status`,
        { isActive: nextStatus }
      );

      showNotice(
        "success",
        nextStatus
          ? "Category activated successfully."
          : "Category deactivated successfully."
      );

      await fetchCategories(true);
    } catch (err) {
      console.error("Category status error:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to update category status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Issue Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the types of civic issues citizens can report.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchCategories(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {notice.message}
        </div>
      )}

      {error && !showForm && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => fetchCategories(true)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={stats.total}
          icon={Tags}
          description="All registered categories"
        />
        <StatCard
          title="Active Categories"
          value={stats.active}
          icon={CheckCircle2}
          description={`${stats.inactive} inactive`}
        />
        <StatCard
          title="Linked Reports"
          value={stats.reports}
          icon={ClipboardList}
          description="Reports using these categories"
        />
        <StatCard
          title="Routing Rules"
          value={stats.rules}
          icon={GitBranch}
          description="Rules linked to categories"
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Active / Inactive filter buttons */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Filter Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose which categories you want to view.
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
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {filter.value === "ALL" && <Tags size={16} />}
                {filter.value === "ACTIVE" && <CheckCircle2 size={16} />}
                {filter.value === "INACTIVE" && <XCircle size={16} />}

                {filter.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            {statusFilter === "ACTIVE"
              ? "Active Categories"
              : statusFilter === "INACTIVE"
                ? "Inactive Categories"
                : "Category Directory"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1
              ? "category"
              : "categories"}{" "}
            found
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center">
            <Tags className="mx-auto mb-3 text-slate-300" size={38} />
            <p className="font-medium text-slate-700">
              {categories.length === 0
                ? "No categories found"
                : "No matching categories"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length === 0
                ? "Add your first issue category."
                : "Try another filter or change your search."}
            </p>
            {categories.length === 0 && (
              <button
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Plus size={16} />
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Reports</th>
                  <th className="px-5 py-4 font-semibold">Routing Rules</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((category) => {
                  const counts = getCounts(category);

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {category.name}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {category.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <ClipboardList size={15} className="text-slate-400" />
                          {counts.reports}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <GitBranch size={15} className="text-slate-400" />
                          {counts.routingRules}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            category.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString(
                              "en-PK",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(category)}
                            title="Edit category"
                            disabled={!!statusUpdatingId}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleStatusChange(category)}
                            disabled={!!statusUpdatingId}
                            title={
                              category.isActive
                                ? "Deactivate category"
                                : "Activate category"
                            }
                            className={`rounded-lg p-2 disabled:opacity-40 ${
                              category.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {statusUpdatingId === category.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Power size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the issue category information.
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Road Damage"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the types of issues in this category..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
