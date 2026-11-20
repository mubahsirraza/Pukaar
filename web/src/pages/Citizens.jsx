
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  CalendarDays,
  FileText,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import api from "../services/api";

const EMPTY_SUMMARY = {
  totalCitizens: 0,
  activeCitizens: 0,
  inactiveCitizens: 0,
};

const EMPTY_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusClass(isActive) {
  return isActive
    ? "bg-green-50 text-green-700"
    : "bg-slate-100 text-slate-600";
}

function getReportStatusClass(status) {
  const normalized = String(status || "").toUpperCase();

  if (["RESOLVED", "CLOSED"].includes(normalized)) {
    return "bg-green-50 text-green-700";
  }

  if (["REJECTED", "CANCELLED"].includes(normalized)) {
    return "bg-red-50 text-red-700";
  }

  if (["IN_PROGRESS", "INPROGRESS"].includes(normalized)) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function Citizens() {
  const [citizens, setCitizens] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const [notice, setNotice] = useState(null);

  const requestIdRef = useRef(0);
  const noticeTimerRef = useRef(null);

  const showNotice = useCallback((type, message) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNotice({ type, message });

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 3500);
  }, []);

  const fetchCitizens = useCallback(
    async (isRefresh = false, signal) => {
      const requestId = ++requestIdRef.current;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/admin/citizens", {
          params: {
            search: search.trim() || undefined,
            status: statusFilter,
            page,
            limit: 10,
          },
          signal,
        });

        if (requestId !== requestIdRef.current) return;

        const data = response.data;

        setCitizens(
          Array.isArray(data.citizens) ? data.citizens : []
        );

        setSummary(data.summary || EMPTY_SUMMARY);
        setPagination(data.pagination || EMPTY_PAGINATION);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        if (err.code === "ERR_CANCELED") return;

        console.error("Failed to fetch citizens:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load citizens. Please try again."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [search, statusFilter, page]
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      fetchCitizens(false, controller.signal);
    }, search ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchCitizens, search]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;

      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const handleFilterChange = (filter) => {
    if (filter === statusFilter) return;

    setStatusFilter(filter);
    setPage(1);
    setSelectedCitizen(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleViewCitizen = async (citizen) => {
    setSelectedCitizen({
      ...citizen,
      __loading: true,
    });

    setProfileLoading(true);

    try {
      const response = await api.get(
        `/admin/citizens/${citizen.id}`
      );

      setSelectedCitizen(response.data.citizen || response.data);
    } catch (err) {
      console.error("Failed to load citizen profile:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to load citizen profile."
      );

      setSelectedCitizen(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleStatus = async (citizen) => {
    if (updatingId) return;

    const newStatus = !citizen.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus ? "activate" : "deactivate"
      } ${citizen.name || "this citizen"}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(citizen.id);

      await api.patch(
        `/admin/citizens/${citizen.id}/status`,
        { isActive: newStatus }
      );

      showNotice(
        "success",
        `Citizen ${newStatus ? "activated" : "deactivated"} successfully.`
      );

      await fetchCitizens(true);

      if (selectedCitizen?.id === citizen.id) {
        setSelectedCitizen((previous) =>
          previous
            ? { ...previous, isActive: newStatus }
            : previous
        );
      }
    } catch (err) {
      console.error("Failed to update citizen status:", err);

      showNotice(
        "error",
        err.response?.data?.message ||
          "Unable to update citizen status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const closeProfile = () => {
    setSelectedCitizen(null);
    setProfileLoading(false);
  };

  const filters = [
    {
      value: "all",
      label: "All Citizens",
      count: summary.totalCitizens,
      icon: Users,
      activeClass: "bg-blue-600 text-white border-blue-600",
      iconColor: "text-blue-100",
    },
    {
      value: "active",
      label: "Active",
      count: summary.activeCitizens,
      icon: UserCheck,
      activeClass: "bg-green-600 text-white border-green-600",
      iconColor: "text-green-100",
    },
    {
      value: "inactive",
      label: "Inactive",
      count: summary.inactiveCitizens,
      icon: UserX,
      activeClass: "bg-amber-500 text-white border-amber-500",
      iconColor: "text-amber-100",
    },
  ];

  const totalPages = pagination.totalPages || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users size={14} className="text-blue-600" />
            Administration
            <span>/</span>
            Citizens
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Citizens Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage registered citizens and their account status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCitizens(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Notification */}
      {notice && (
        <div
          role="alert"
          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}

          <span className="flex-1">{notice.message}</span>

          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-1 hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Citizens</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {summary.totalCitizens}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Citizens</p>
              <h2 className="mt-1 text-2xl font-bold text-green-600">
                {summary.activeCitizens}
              </h2>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
              <UserCheck size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive Citizens</p>
              <h2 className="mt-1 text-2xl font-bold text-amber-600">
                {summary.inactiveCitizens}
              </h2>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <UserX size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filters and Search */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleFilterChange(filter.value)}
                  aria-pressed={isActive}
                  className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${
                    isActive
                      ? filter.activeClass
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? filter.iconColor : ""
                    }`}
                  />

                  {filter.label}

                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
              placeholder="Search citizens..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={17} />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => fetchCitizens(true)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Citizens Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2">
              <LoaderCircle
                size={27}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm text-slate-500">
                Loading citizens...
              </p>
            </div>
          ) : citizens.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <Users size={30} className="text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800">
                No citizens found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or selected filter.
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPage(1);
                  }}
                  className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Citizen</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Reports</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {citizens.map((citizen) => (
                  <tr
                    key={citizen.id}
                    className="transition-colors duration-150 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {getInitials(citizen.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {citizen.name || "Unnamed citizen"}
                          </p>
                          <p className="max-w-40 truncate text-xs text-slate-400">
                            {citizen.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          <span className="max-w-48 truncate">
                            {citizen.email || "No email"}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          {citizen.phone || "No phone"}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(citizen.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        <FileText size={13} />
                        {citizen._count?.reports ??
                          citizen.reportsCount ??
                          0}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          citizen.isActive
                        )}`}
                      >
                        {citizen.isActive ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {citizen.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewCitizen(citizen)}
                          title="View profile"
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(citizen)}
                          disabled={updatingId === citizen.id}
                          title={
                            citizen.isActive
                              ? "Deactivate citizen"
                              : "Activate citizen"
                          }
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            citizen.isActive
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {updatingId === citizen.id ? (
                            <LoaderCircle
                              size={13}
                              className="animate-spin"
                            />
                          ) : citizen.isActive ? (
                            <ShieldOff size={13} />
                          ) : (
                            <ShieldCheck size={13} />
                          )}

                          {citizen.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && citizens.length > 0 && (
          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {(page - 1) * pagination.limit + 1}
              </span>
              {" "}–{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  page * pagination.limit,
                  pagination.total
                )}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-slate-700">
                {pagination.total}
              </span>{" "}
              citizens
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {page} / {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((previous) =>
                    Math.min(totalPages, previous + 1)
                  )
                }
                disabled={
                  page >= totalPages || totalPages === 0 || loading
                }
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Profile Modal */}
      {selectedCitizen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfile();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="citizen-profile-title"
            className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h2
                  id="citizen-profile-title"
                  className="text-base font-bold text-slate-900"
                >
                  Citizen Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Personal details and report history
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close profile"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {profileLoading || selectedCitizen.__loading ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2">
                <LoaderCircle
                  size={27}
                  className="animate-spin text-blue-600"
                />
                <p className="text-sm text-slate-500">
                  Loading citizen profile...
                </p>
              </div>
            ) : (
              <div className="space-y-5 p-4">
                {/* Citizen Details */}
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                    {getInitials(selectedCitizen.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCitizen.name || "Unnamed citizen"}
                    </h3>
                    <p className="truncate text-xs text-slate-500">
                      {selectedCitizen.email || "No email available"}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(
                        selectedCitizen.isActive
                      )}`}
                    >
                      {selectedCitizen.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Personal Information */}
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <UserRound size={16} className="text-blue-600" />
                    Personal Information
                  </h4>

                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">Full Name</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedCitizen.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-700">
                        {selectedCitizen.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedCitizen.phone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Registered</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <CalendarDays size={14} />
                        {formatDate(selectedCitizen.createdAt)}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">Citizen ID</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">
                        {selectedCitizen.id}
                      </p>
                    </div>

                    {selectedCitizen.address && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-400">Address</p>
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          {selectedCitizen.address}
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Reports */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <FileText size={16} className="text-blue-600" />
                      Report History
                    </h4>

                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {Array.isArray(selectedCitizen.reports)
                        ? selectedCitizen.reports.length
                        : 0}{" "}
                      Reports
                    </span>
                  </div>

                  {Array.isArray(selectedCitizen.reports) &&
                  selectedCitizen.reports.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCitizen.reports.map((report) => (
                        <div
                          key={report.id}
                          className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="break-all font-mono text-xs font-semibold text-blue-700">
                                {report.trackingCode || report.id}
                              </p>

                              <p className="mt-1.5 text-sm text-slate-700">
                                {report.description ||
                                  report.title ||
                                  "No description available"}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${getReportStatusClass(
                                report.status
                              )}`}
                            >
                              {String(report.status || "Pending").replace(
                                /_/g,
                                " "
                              )}
                            </span>
                          </div>

                          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays size={12} />
                            {formatDate(
                              report.createdAt || report.submittedAt
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                      <FileText
                        size={23}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        No reports submitted.
                      </p>
                    </div>
                  )}
                </section>

                {/* Account Action */}
                <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-slate-400">
                    Account management
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleStatus(selectedCitizen)
                    }
                    disabled={updatingId === selectedCitizen.id}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                      selectedCitizen.isActive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {updatingId === selectedCitizen.id ? (
                      <LoaderCircle
                        size={15}
                        className="animate-spin"
                      />
                    ) : selectedCitizen.isActive ? (
                      <ShieldOff size={15} />
                    ) : (
                      <ShieldCheck size={15} />
                    )}

                    {selectedCitizen.isActive
                      ? "Deactivate Account"
                      : "Activate Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
