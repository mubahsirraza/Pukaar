
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  Trash2,
  Users,
  ClipboardList,
  GitBranch,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import api from "../services/api";

const getDepartments = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.departments)) return data.departments;
  return [];
};

const getLinkedCounts = (department) => ({
  reports: Number(department?._count?.reports ?? department?.reportsCount ?? 0),
  routingRules: Number(
    department?._count?.routingRules ?? department?.routingRulesCount ?? 0
  ),
});

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const fetchDepartments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await api.get("/admin/departments");
      setDepartments(getDepartments(response.data));
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load departments. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const statistics = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((item) => item.isActive).length;

    const reports = departments.reduce(
      (sum, item) => sum + getLinkedCounts(item).reports,
      0
    );

    const routingRules = departments.reduce(
      (sum, item) => sum + getLinkedCounts(item).routingRules,
      0
    );

    return {
      total,
      active,
      inactive: total - active,
      reports,
      routingRules,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        department.name?.toLowerCase().includes(searchText) ||
        department.description?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && department.isActive) ||
        (statusFilter === "INACTIVE" && !department.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  const openCreateForm = () => {
    setEditingDepartment(null);
    setFormData({ name: "", description: "" });
    setShowForm(true);
  };

  const openEditForm = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name || "",
      description: department.description || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingDepartment(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();

    if (!name) {
      showNotice("error", "Department name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = { name, description: description || null };

      if (editingDepartment) {
        await api.patch(
          `/admin/departments/${editingDepartment.id}`,
          payload
        );
        showNotice("success", "Department updated successfully.");
      } else {
        await api.post("/admin/departments", payload);
        showNotice("success", "Department created successfully.");
      }

      closeForm();
      await fetchDepartments(true);
    } catch (err) {
      console.error("Department save failed:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to save department. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (department) => {
    const nextStatus = !department.isActive;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate "${department.name}"?`
        : `Deactivate "${department.name}"? Active routing rules for this department will also be deactivated.`
    );

    if (!confirmed) return;

    try {
      setStatusUpdatingId(department.id);

      await api.patch(`/admin/departments/${department.id}/status`, {
        isActive: nextStatus,
      });

      showNotice(
        "success",
        nextStatus
          ? "Department activated successfully."
          : "Department deactivated successfully. Its active routing rules have also been deactivated."
      );

      await fetchDepartments(true);
    } catch (err) {
      console.error("Department status update failed:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to update department status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openDeleteDialog = (department) => {
    setDepartmentToDelete(department);
    setDeleteError("");
  };

  const closeDeleteDialog = () => {
    if (deletingId) return;

    setDepartmentToDelete(null);
    setDeleteError("");
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    const department = departmentToDelete;
    const linked = getLinkedCounts(department);

    // Frontend safeguard only. The backend performs the authoritative check.
    if (linked.reports > 0 || linked.routingRules > 0) {
      setDeleteError(
        "This department cannot be deleted because it has linked records. Deactivate it instead."
      );
      return;
    }

    try {
      setDeletingId(department.id);
      setDeleteError("");

      await api.delete(`/admin/departments/${department.id}`);

      setDepartmentToDelete(null);
      showNotice("success", "Department permanently deleted.");

      await fetchDepartments(true);
    } catch (err) {
      console.error("Department deletion failed:", err);

      const message =
        err.response?.data?.message ||
        "Unable to delete department. Please try again.";

      setDeleteError(message);

      // Refresh counts in case records were linked after the page loaded.
      await fetchDepartments(true);
    } finally {
      setDeletingId(null);
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
            Departments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage government departments and their report assignments.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchDepartments(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus size={17} />
            Add Department
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

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => fetchDepartments(true)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Departments"
          value={statistics.total}
          icon={Building2}
          description="All registered departments"
        />
        <StatCard
          title="Active Departments"
          value={statistics.active}
          icon={CheckCircle2}
          description={`${statistics.inactive} inactive`}
        />
        <StatCard
          title="Linked Reports"
          value={statistics.reports}
          icon={ClipboardList}
          description="Reports assigned to departments"
        />
        <StatCard
          title="Routing Rules"
          value={statistics.routingRules}
          icon={GitBranch}
          description="Rules linked to departments"
        />
      </div>

      
{/* Search and status filters */}
<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-4">
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search departments..."
        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setStatusFilter("ALL")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          statusFilter === "ALL"
            ? "bg-blue-700 text-white shadow-sm"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        All Departments ({statistics.total})
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("ACTIVE")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          statusFilter === "ACTIVE"
            ? "bg-green-600 text-white shadow-sm"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-green-50"
        }`}
      >
        Active ({statistics.active})
      </button>

      <button
        type="button"
        onClick={() => setStatusFilter("INACTIVE")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          statusFilter === "INACTIVE"
            ? "bg-slate-700 text-white shadow-sm"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        Inactive ({statistics.inactive})
      </button>
    </div>
  </div>
</div>


      {/* Departments table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Department Directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredDepartments.length} department(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Loading departments...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="mx-auto mb-3 text-slate-300" size={38} />
            <p className="font-medium text-slate-700">
              No departments found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or add a new department.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Department</th>
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
                {filteredDepartments.map((department) => {
                  const linked = getLinkedCounts(department);
                  const hasLinkedRecords =
                    linked.reports > 0 || linked.routingRules > 0;

                  return (
                    <tr
                      key={department.id}
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {department.name}
                        </div>
                        <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {department.description || "No description"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <ClipboardList size={15} className="text-slate-400" />
                          {linked.reports}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <GitBranch size={15} className="text-slate-400" />
                          {linked.routingRules}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            department.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {department.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(department.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(department)}
                            title="Edit department"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleStatusChange(department)}
                            disabled={statusUpdatingId === department.id}
                            title={
                              department.isActive
                                ? "Deactivate department"
                                : "Activate department"
                            }
                            className={`rounded-lg p-2 disabled:opacity-40 ${
                              department.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {statusUpdatingId === department.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Power size={17} />
                            )}
                          </button>

                          <button
                            onClick={() => openDeleteDialog(department)}
                            title={
                              hasLinkedRecords
                                ? "Cannot delete: linked records exist"
                                : "Delete department"
                            }
                            className={`rounded-lg p-2 ${
                              hasLinkedRecords
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                          >
                            <Trash2 size={17} />
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
                  {editingDepartment ? "Edit Department" : "Add Department"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the department information below.
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
                  Department Name <span className="text-red-500">*</span>
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
                  placeholder="e.g. Public Works Department"
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
                  placeholder="Describe the department's responsibilities..."
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
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingDepartment
                      ? "Save Changes"
                      : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {departmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-3 text-red-600">
                  <AlertTriangle size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete Department
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Review the linked records before proceeding.
                  </p>
                </div>
              </div>

              <button
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingId)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm text-slate-700">
                You are attempting to delete{" "}
                <strong>{departmentToDelete.name}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ClipboardList size={15} />
                    Linked Reports
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {getLinkedCounts(departmentToDelete).reports}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <GitBranch size={15} />
                    Routing Rules
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {getLinkedCounts(departmentToDelete).routingRules}
                  </p>
                </div>
              </div>

              {getLinkedCounts(departmentToDelete).reports > 0 ||
              getLinkedCounts(departmentToDelete).routingRules > 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        This department cannot be deleted.
                      </p>
                      <p className="mt-1 text-xs leading-5">
                        Existing reports or routing rules are linked to this
                        department. Deactivate it instead to preserve
                        historical records and maintain database integrity.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2 text-amber-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        Permanent deletion
                      </p>
                      <p className="mt-1 text-xs leading-5">
                        This department has no linked reports or routing
                        rules. Deletion cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={closeDeleteDialog}
                  disabled={Boolean(deletingId)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteDepartment}
                  disabled={
                    Boolean(deletingId) ||
                    getLinkedCounts(departmentToDelete).reports > 0 ||
                    getLinkedCounts(departmentToDelete).routingRules > 0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingId ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
