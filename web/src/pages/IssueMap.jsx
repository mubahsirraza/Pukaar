
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
} from "lucide-react";
import api from "../services/api";

// Default center is used only when no report coordinates are available.
const DEFAULT_CENTER = [30.3753, 69.3451];

const STATUS_OPTIONS = [
  "PENDING_VERIFICATION",
  "VERIFIED_AND_ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
];

const STATUS_LABELS = {
  PENDING_VERIFICATION: "Pending Verification",
  VERIFIED_AND_ASSIGNED: "Verified & Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
  DUPLICATE: "Duplicate",
};

const STATUS_COLORS = {
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  VERIFIED_AND_ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  DUPLICATE: "bg-gray-100 text-gray-700",
};

const createReportIcon = (count) =>
  L.divIcon({
    className: "pukaar-map-marker",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: #2563EB;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 13px;
          font-weight: 700;
        ">${count}</span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });

// Automatically adjusts the map to display available report locations.
function FitMapToReports({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations.length) return;

    const bounds = L.latLngBounds(
      locations.map((location) => [
        location.latitude,
        location.longitude,
      ])
    );

    if (locations.length === 1) {
      map.setView(
        [locations[0].latitude, locations[0].longitude],
        15
      );
    } else {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [locations, map]);

  return null;
}

function formatStatus(status) {
  return STATUS_LABELS[status] || status?.replaceAll("_", " ") || "Unknown";
}

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function IssueMap() {
  const [reports, setReports] = useState([]);
const [activeCategories, setActiveCategories] = useState([]);
const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const fetchReports = async () => {
  try {
    setLoading(true);
    setError("");

    const [reportsResponse, categoriesResponse] = await Promise.all([
      api.get("/admin/reports/map"),
      api.get("/admin/categories"),
    ]);

    setReports(reportsResponse.data.reports || []);

    setActiveCategories(
      (categoriesResponse.data.categories || []).filter(
        (category) => category.isActive
      )
    );
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to load issue locations. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchReports();
  }, []);

  // Only reports with valid geographical coordinates can appear on the map.
  const validReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          Number.isFinite(Number(report.latitude)) &&
          Number.isFinite(Number(report.longitude)) &&
          Number(report.latitude) >= -90 &&
          Number(report.latitude) <= 90 &&
          Number(report.longitude) >= -180 &&
          Number(report.longitude) <= 180
      ),
    [reports]
  );

 

  const filteredReports = useMemo(
    () =>
      validReports.filter((report) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          report.status === statusFilter;

        const matchesCategory =
          categoryFilter === "ALL" ||
          report.category?.id === categoryFilter;

        return matchesStatus && matchesCategory;
      }),
    [validReports, statusFilter, categoryFilter]
  );

  // Reports at exactly the same coordinates share one marker.
  const locations = useMemo(() => {
    const groups = new Map();

    filteredReports.forEach((report) => {
      const latitude = Number(report.latitude);
      const longitude = Number(report.longitude);
      const key = `${latitude},${longitude}`;

      if (!groups.has(key)) {
        groups.set(key, {
          latitude,
          longitude,
          reports: [],
        });
      }

      groups.get(key).reports.push(report);
    });

    return Array.from(groups.values());
  }, [filteredReports]);

  const pendingCount = filteredReports.filter(
    (report) => report.status === "PENDING_VERIFICATION"
  ).length;

  const inProgressCount = filteredReports.filter(
    (report) => report.status === "IN_PROGRESS"
  ).length;

  const resolvedCount = filteredReports.filter(
    (report) => report.status === "RESOLVED"
  ).length;

  const mapCenter = locations.length
    ? [locations[0].latitude, locations[0].longitude]
    : DEFAULT_CENTER;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-600">
            Loading issue locations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-500" />

        <h3 className="font-semibold text-gray-900">
          Unable to load issue map
        </h3>

        <p className="mt-2 text-sm text-gray-600">{error}</p>

        <button
          onClick={fetchReports}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-[#10243E]">
              Issue Map
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Explore reported civic issues across their geographical locations.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh Map
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Total Reports
            </p>
            <MapPin className="text-blue-600" size={21} />
          </div>
          <h3 className="mt-3 text-3xl font-bold text-[#10243E]">
            {filteredReports.length}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Reports matching filters
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Pending Verification
            </p>
            <Clock className="text-amber-500" size={21} />
          </div>
          <h3 className="mt-3 text-3xl font-bold text-amber-600">
            {pendingCount}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Awaiting administrator review
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              In Progress
            </p>
            <RefreshCw className="text-violet-500" size={21} />
          </div>
          <h3 className="mt-3 text-3xl font-bold text-violet-600">
            {inProgressCount}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Currently being addressed
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">
              Resolved
            </p>
            <CheckCircle2 className="text-emerald-600" size={21} />
          </div>
          <h3 className="mt-3 text-3xl font-bold text-emerald-600">
            {resolvedCount}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Successfully resolved reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={17} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">
            Filter Map Reports
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Report Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Issue Category
            </label>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Categories</option>

             {activeCategories.map((category) => (
  <option key={category.id} value={category.id}>
    {category.name}
  </option>
))}
            </select>
          </div>

        </div>
      </div>

      {/* Interactive map */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Layers size={19} className="text-blue-600" />
            <h3 className="font-semibold text-[#10243E]">
              Geographic Distribution
            </h3>
          </div>

          <p className="text-xs text-gray-500">
            {locations.length} map locations · {filteredReports.length} reports
          </p>
        </div>

        <div className="relative z-0 h-[480px] w-full sm:h-[580px]">
          <MapContainer
            center={mapCenter}
            zoom={locations.length ? 13 : 5}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitMapToReports locations={locations} />

            {locations.map((location) => (
              <Marker
                key={`${location.latitude},${location.longitude}`}
                position={[
                  location.latitude,
                  location.longitude,
                ]}
                icon={createReportIcon(location.reports.length)}
              >
                <Popup maxWidth={340} minWidth={260}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {location.reports.length} Report
                        {location.reports.length !== 1 ? "s" : ""}
                        {" "}at this location
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {location.latitude.toFixed(6)},{" "}
                        {location.longitude.toFixed(6)}
                      </p>
                    </div>

                    <div className="max-h-[300px] space-y-3 overflow-y-auto">
                      {location.reports.map((report) => (
                        <div
                          key={report.id}
                          className="border-t border-gray-200 pt-3"
                        >
                          <p className="text-xs font-bold text-blue-700">
                            {report.trackingCode}
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-gray-800">
                            {report.description}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                STATUS_COLORS[report.status] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {formatStatus(report.status)}
                            </span>

                            {report.verifiedSeverity && (
                              <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700">
                                {report.verifiedSeverity} Severity
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-gray-500">
                            Category: {report.category?.name || "Not assigned"}
                          </p>

                          <p className="text-xs text-gray-500">
                            Department: {report.department?.name || "Not assigned"}
                          </p>

                          {report.locationAddress && (
                            <p className="mt-1 text-xs text-gray-500">
                              Location: {report.locationAddress}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(report.createdAt)}
                          </p>

                          <a
                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Open in Google Maps ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {filteredReports.length === 0 && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/75">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="font-semibold text-gray-700">
                  No reports found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try changing your filters.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">
            Each marker represents one unique coordinate location. The number inside represents the reports at that location.
          </p>
        </div>
      </div>

      {/* No coordinate warning */}
      {reports.length > validReports.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {reports.length - validReports.length} report(s) have missing or invalid coordinates and cannot be displayed on the map.
        </div>
      )}

    </div>
  );
}
