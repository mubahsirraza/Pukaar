
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  MapPin,
  User,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import api from "../services/api";

const STATUSES = [
  "SUBMITTED",
  "AI_PROCESSING",
  "PENDING_VERIFICATION",
  "VERIFIED_AND_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
];

const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  AI_PROCESSING: "AI Processing",
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED_AND_ASSIGNED: "Verified & Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
};

const STATUS_STYLES = {
  SUBMITTED: "bg-slate-100 text-slate-700",
  AI_PROCESSING: "bg-purple-100 text-purple-700",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  VERIFIED_AND_ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  DUPLICATE: "bg-orange-100 text-orange-700",
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReportCoordinates(report) {
  const latitude = Number(report?.latitude);
  const longitude = Number(report?.longitude);

  if (
    report?.latitude === null ||
    report?.latitude === undefined ||
    report?.longitude === null ||
    report?.longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function ReportLocation({ report, compact = false }) {
  const coordinates = getReportCoordinates(report);

  if (!coordinates) {
    return (
      <span className="text-xs text-slate-400">
        Location unavailable
      </span>
    );
  }

  const { latitude, longitude } = coordinates;

  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="min-w-[150px]">
      <div className="flex items-start gap-2">
        <MapPin
          size={16}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="max-w-[220px] text-sm font-medium text-slate-700">
            {report.locationAddress || "Address not available"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>

          {!compact && report.isPublicLocationApproximate && (
            <p className="mt-1 text-xs text-amber-600">
              Approximate public location
            </p>
          )}

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View on Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {STATUS_LABELS[status] || status || "Unknown"}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-700">
        {children || "Not available"}
      </div>
    </div>
  );
}

function ReportDetails({ report, onClose }) {
  if (!report) return null;

  const latestAnalysis = report.aiAnalyses?.[0];

  

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Report details
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#172B45]">
              {report.trackingCode}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close report details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-[#172B45]">
                Report information
              </h3>
              <StatusBadge status={report.status} />
            </div>

            {report.imageUrl && (
              <img
                src={report.imageUrl}
                alt="Reported issue"
                className="mb-4 max-h-72 w-full rounded-xl bg-slate-100 object-cover"
              />
            )}

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {report.description || "No description provided."}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Submitted</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(report.createdAt)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Verified severity</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {report.verifiedSeverity || "Not verified"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-[#172B45]">
              Citizen information
            </h3>

            <div className="rounded-xl border border-slate-100 px-4">
              <DetailRow label="Name">
                <span className="flex items-center gap-2">
                  <User size={15} />
                  {report.citizen?.name}
                </span>
              </DetailRow>

              <DetailRow label="Email">
                {report.citizen?.email}
              </DetailRow>

              <DetailRow label="Phone">
                {report.citizen?.phone}
              </DetailRow>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-[#172B45]">
              Classification and assignment
            </h3>

            <div className="rounded-xl border border-slate-100 px-4">
              <DetailRow label="Verified category">
                {report.category?.name}
              </DetailRow>

              <DetailRow label="Assigned department">
                {report.department?.name}
              </DetailRow>

              <DetailRow label="Verification notes">
                {report.verificationNotes}
              </DetailRow>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-bold text-[#172B45]">
              AI analysis
            </h3>

            {latestAnalysis ? (
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Latest AI result
                  </span>
                  <StatusBadge
                    status={
                      latestAnalysis.status === "COMPLETED"
                        ? "RESOLVED"
                        : latestAnalysis.status === "FAILED"
                          ? "REJECTED"
                          : "AI_PROCESSING"
                    }
                  />
                </div>

                <DetailRow label="Suggested category">
                  {latestAnalysis.suggestedCategory}
                </DetailRow>

                <DetailRow label="Suggested severity">
                  {latestAnalysis.suggestedSeverity}
                </DetailRow>

                <DetailRow label="Confidence">
                  {typeof latestAnalysis.confidence === "number"
                    ? `${(latestAnalysis.confidence * 100).toFixed(1)}%`
                    : "—"}
                </DetailRow>

                <DetailRow label="Model">
                  {latestAnalysis.modelName}
                </DetailRow>

                <DetailRow label="AI rationale">
                  {latestAnalysis.rationale}
                </DetailRow>

                <DetailRow label="Analysis date">
                  {formatDate(latestAnalysis.createdAt)}
                </DetailRow>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No AI analysis is available for this report.
              </p>
            )}
          </section>

          
<section>
  <h3 className="mb-3 font-bold text-[#172B45]">
    <MapPin className="mr-2 inline" size={17} />
    Report location
  </h3>

  <div className="rounded-xl border border-slate-100 p-4">
    <ReportLocation report={report} />

    {report.isPublicLocationApproximate && (
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-700">
        This location is approximate when displayed publicly.
        Use the coordinates as a reference when reviewing the report.
      </p>
    )}
  </div>
</section>


          <section>
            <h3 className="mb-3 font-bold text-[#172B45]">
              Status history
            </h3>

            {report.statusHistory?.length ? (
              <div className="space-y-4">
                {report.statusHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative border-l-2 border-blue-100 pl-5"
                  >
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-blue-500" />

                    <p className="text-sm font-semibold text-slate-700">
                      {STATUS_LABELS[entry.newStatus] ||
                        entry.newStatus}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(entry.createdAt)}
                    </p>

                    {entry.remarks && (
                      <p className="mt-2 text-sm text-slate-500">
                        {entry.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No status history available.
              </p>
            )}
          </section>

          {report.duplicateOf && (
            <section>
              <h3 className="mb-3 font-bold text-[#172B45]">
                Original report
              </h3>
              <div className="rounded-xl bg-orange-50 p-4 text-sm">
                <p className="font-semibold text-orange-800">
                  {report.duplicateOf.trackingCode}
                </p>
                <p className="mt-1 text-orange-700">
                  {STATUS_LABELS[report.duplicateOf.status] ||
                    report.duplicateOf.status}
                </p>
              </div>
            </section>
          )}

          {report.duplicates?.length > 0 && (
            <section>
              <h3 className="mb-3 font-bold text-[#172B45]">
                Reports marked as duplicates
              </h3>

              <div className="space-y-2">
                {report.duplicates.map((duplicate) => (
                  <div
                    key={duplicate.id}
                    className="rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <p className="font-semibold text-slate-700">
                      {duplicate.trackingCode}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {STATUS_LABELS[duplicate.status] ||
                        duplicate.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AllReports() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");
      setCategories(
        (response.data.categories || []).filter(
          (category) => category.isActive
        )
      );
    } catch (err) {
      console.error("Category loading error:", err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit,
      };

      if (search.trim()) params.q = search.trim();
      if (status) params.status = status;
      if (categoryId) params.categoryId = categoryId;

      const response = await api.get("/admin/reports", { params });

      setReports(response.data.reports || []);
      setPagination(
        response.data.pagination || {
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReports();
    }, 350);

    return () => clearTimeout(timeout);
  }, [page, search, status, categoryId]);

  const openReportDetails = async (reportId) => {
    setDetailsLoading(true);
    setSelectedReport(null);

    try {
      const response = await api.get(`/admin/reports/${reportId}`);
      setSelectedReport(response.data.report);
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Unable to load report details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setCategoryId("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Manage, review and monitor citizen-submitted reports.
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[#172B45]">
            All Reports
          </h2>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="dashboard-card rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Matching reports</p>
            <FileText className="text-blue-600" size={20} />
          </div>
          <p className="mt-3 text-2xl font-bold text-[#172B45]">
            {pagination.total}
          </p>
        </div>

        <div className="dashboard-card rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-sm text-slate-500">
            Current page
          </p>
          <p className="mt-3 text-2xl font-bold text-[#172B45]">
            {pagination.totalPages ? page : 0}
            <span className="text-base font-medium text-slate-400">
              {" "} / {pagination.totalPages || 0}
            </span>
          </p>
        </div>

        <div className="dashboard-card rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-sm text-slate-500">
            Reports displayed
          </p>
          <p className="mt-3 text-2xl font-bold text-[#172B45]">
            {reports.length}
          </p>
        </div>
      </div>

      <div className="dashboard-card rounded-2xl border border-slate-100 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search tracking code or description..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>

          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {(search || status || categoryId) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-[#172B45]">
            Report records
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Latest submitted reports appear first.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <LoaderCircle
              size={30}
              className="animate-spin text-blue-600"
            />
            <p className="text-sm text-slate-500">
              Loading reports...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={32} className="text-red-500" />
            <p className="mt-3 font-semibold text-slate-700">
              Unable to load reports
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {error}
            </p>
            <button
              onClick={fetchReports}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <FileText size={34} className="text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">
              No reports found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-4 font-semibold">
                      Report
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Citizen
                    </th>
                    <th className="px-5 py-4 font-semibold">
  Category
</th>

<th className="px-5 py-4 font-semibold">
  Location
</th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Submitted
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#172B45]">
                          {report.trackingCode}
                        </p>
                        <p className="mt-1 max-w-[230px] truncate text-xs text-slate-500">
                          {report.description}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {report.citizen?.name || "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {report.citizen?.email || "—"}
                        </p>
                      </td>

                     <td className="px-5 py-4 text-sm text-slate-600">
  {report.category?.name || "Unclassified"}
</td>

<td className="px-5 py-4">
  <ReportLocation report={report} compact />
</td>

                      <td className="px-5 py-4">
                        <StatusBadge status={report.status} />
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {formatDate(report.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            openReportDetails(report.id)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Showing {((page - 1) * limit) + 1}–
                {Math.min(page * limit, pagination.total)} of{" "}
                {pagination.total} reports
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-2 text-sm font-semibold text-slate-600">
                  {page} / {pagination.totalPages || 1}
                </span>

                <button
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailsLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-xl">
            <LoaderCircle
              size={22}
              className="animate-spin text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">
              Loading report details...
            </span>
          </div>
        </div>
      )}

      {selectedReport && (
        <ReportDetails
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
