
import { useCallback, useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../services/api";

// Chart colors
const STATUS_COLORS = {
  SUBMITTED: "#64748B",
  AI_PROCESSING: "#8B5CF6",
  PENDING_VERIFICATION: "#F59E0B",
  VERIFIED_AND_ASSIGNED: "#3B82F6",
  IN_PROGRESS: "#06B6D4",
  RESOLVED: "#16A34A",
  REJECTED: "#EF4444",
  DUPLICATE: "#94A3B8",
};

const SEVERITY_COLORS = {
  LOW: "#16A34A",
  MEDIUM: "#F59E0B",
  HIGH: "#EF4444",
};

// Format numbers
const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-US");

// Format status names
const formatLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Reusable clickable metric card
function MetricCard({
  title,
  value,
  description,
  accent,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="dashboard-card group w-full rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
      aria-label={`View reports: ${title}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#10243E]">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`h-12 w-1.5 shrink-0 rounded-full ${accent}`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-semibold text-blue-600">
          View matching reports
        </span>

        <span className="text-sm text-blue-600 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>
  );
}

// Reusable chart container
function ChartPanel({ title, description, children }) {
  return (
    <section className="dashboard-card min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-[#10243E]">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>

      {children}
    </section>
  );
}

// Empty chart message
function EmptyChart({ message = "No data available yet." }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl bg-slate-50">
      <div className="text-center">
        <p className="text-3xl text-slate-300">—</p>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export default function Analytics({ onNavigateToReports }) {
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all analytics endpoints
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        overviewResponse,
        statusResponse,
        categoryResponse,
        severityResponse,
        departmentResponse,
        monthlyResponse,
        resolutionResponse,
      ] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/by-status"),
        api.get("/admin/analytics/by-category"),
        api.get("/admin/analytics/by-severity"),
        api.get("/admin/analytics/by-department"),
        api.get("/admin/analytics/monthly", {
          params: { year: selectedYear },
        }),
        api.get("/admin/analytics/resolution"),
      ]);

      setAnalytics({
        overview: overviewResponse.data.overview || {},
        statuses: statusResponse.data.data || [],
        categories: categoryResponse.data.data || [],
        severities: severityResponse.data.data || [],
        departments: departmentResponse.data.data || [],
        monthly: monthlyResponse.data.data || [],
        resolution: resolutionResponse.data.metrics || {},
      });
    } catch (err) {
      console.error("Analytics loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Navigate to All Reports with a selected status
  const handleMetricClick = (status = "") => {
    if (typeof onNavigateToReports === "function") {
      onNavigateToReports(status);
    }
  };

  // Prepare chart data
  const overview = analytics?.overview || {};
  const resolution = analytics?.resolution || {};

  const statusData = (analytics?.statuses || []).map((item) => ({
    name: formatLabel(item.status),
    total: Number(item.total || 0),
    fill: STATUS_COLORS[item.status] || "#64748B",
  }));

  const severityData = (analytics?.severities || []).map((item) => ({
    name: formatLabel(item.severity),
    total: Number(item.total || 0),
    fill: SEVERITY_COLORS[item.severity] || "#64748B",
  }));

  const categoryData = [...(analytics?.categories || [])]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .map((item) => ({
      name: item.category || "Uncategorized",
      total: Number(item.total || 0),
    }));

  const departmentData = [...(analytics?.departments || [])]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .map((item) => ({
      name: item.department || "Unassigned",
      total: Number(item.total || 0),
    }));

  const years = Array.from(
    { length: 5 },
    (_, index) => new Date().getFullYear() - index
  );

  const resolutionRate = Number(
    resolution.resolutionRate ?? overview.resolutionRate ?? 0
  );

  const averageResolutionTime = Number(
    resolution.averageResolutionTimeHours || 0
  );

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10243E]">
            Analytics & Reporting
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Monitor civic reports, issue trends and resolution performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={loading ? "animate-spin" : ""}>↻</span>
          Refresh Data
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Analytics could not be loaded
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      )}

      {/* LOADING MESSAGE */}
      {loading && !analytics && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            Loading analytics from the server...
          </p>
        </div>
      )}

      {/* REPORT OVERVIEW */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-[#10243E]">
            Report Overview
          </h3>

          <span className="text-xs text-slate-400">
            All-time statistics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Reports"
            value={analytics ? formatNumber(overview.totalReports) : "—"}
            description="All reports in the system"
            accent="bg-blue-500"
            disabled={!analytics}
            onClick={() => handleMetricClick("")}
          />

          <MetricCard
            title="Pending Verification"
            value={
              analytics
                ? formatNumber(overview.pendingVerification)
                : "—"
            }
            description="Awaiting admin verification"
            accent="bg-amber-500"
            disabled={!analytics}
            onClick={() =>
              handleMetricClick("PENDING_VERIFICATION")
            }
          />

          <MetricCard
            title="In Progress"
            value={analytics ? formatNumber(overview.inProgress) : "—"}
            description="Currently being addressed"
            accent="bg-cyan-500"
            disabled={!analytics}
            onClick={() => handleMetricClick("IN_PROGRESS")}
          />

          <MetricCard
            title="Resolved Reports"
            value={analytics ? formatNumber(overview.resolved) : "—"}
            description="Successfully resolved reports"
            accent="bg-green-500"
            disabled={!analytics}
            onClick={() => handleMetricClick("RESOLVED")}
          />
        </div>
      </section>

      {/* RESOLUTION METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#10243E] p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-100/70">
            Resolution Rate
          </p>

          <h3 className="mt-3 text-4xl font-bold">
            {analytics ? `${resolutionRate.toFixed(1)}%` : "—"}
          </h3>

          <p className="mt-2 text-xs text-blue-100/60">
            Percentage of reports successfully resolved
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Average Resolution Time
          </p>

          <h3 className="mt-3 text-4xl font-bold text-[#10243E]">
            {analytics
              ? `${averageResolutionTime.toLocaleString("en-US", {
                  maximumFractionDigits: 1,
                })} hrs`
              : "—"}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Average time from report creation to resolution
          </p>
        </div>
      </div>

      {/* MONTHLY REPORT TRENDS */}
      <ChartPanel
        title="Monthly Reporting Trends"
        description="Number of reports submitted in each month."
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Reporting Year
          </span>

          <select
            value={selectedYear}
            onChange={(event) =>
              setSelectedYear(Number(event.target.value))
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {analytics?.monthly?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.monthly}
              margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E9EEF5"
              />

              <XAxis
                dataKey="monthName"
                tickFormatter={(value) => String(value).slice(0, 3)}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                formatter={(value) => [
                  formatNumber(value),
                  "Reports",
                ]}
              />

              <Bar
                dataKey="total"
                name="Reports"
                fill="#3B82F6"
                radius={[5, 5, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No monthly report data available." />
        )}
      </ChartPanel>

      {/* STATUS AND SEVERITY */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* STATUS DISTRIBUTION */}
        <ChartPanel
          title="Reports by Status"
          description="Distribution of reports across workflow statuses."
        >
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {statusData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.fill}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => formatNumber(value)}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-600">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {statusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 text-xs text-slate-500"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />

                    <span className="truncate">{item.name}</span>

                    <strong className="ml-auto text-slate-700">
                      {formatNumber(item.total)}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart />
          )}
        </ChartPanel>

        {/* SEVERITY DISTRIBUTION */}
        <ChartPanel
          title="Reports by Severity"
          description="Distribution based on report severity."
        >
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={severityData}
                margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E9EEF5"
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatNumber(value)}
                />

                <Bar
                  dataKey="total"
                  name="Reports"
                  radius={[6, 6, 0, 0]}
                >
                  {severityData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.fill}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No severity data available." />
          )}
        </ChartPanel>
      </div>

      {/* CATEGORY AND DEPARTMENT */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* CATEGORY ANALYSIS */}
        <ChartPanel
          title="Reports by Category"
          description="Categories ranked by number of reports."
        >
          {categoryData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(280, categoryData.length * 48)}
            >
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E9EEF5"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatNumber(value)}
                />

                <Bar
                  dataKey="total"
                  name="Reports"
                  fill="#6366F1"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No category report data available." />
          )}
        </ChartPanel>

        {/* DEPARTMENT ANALYSIS */}
        <ChartPanel
          title="Reports by Department"
          description="Number of reports assigned to each department."
        >
          {departmentData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(280, departmentData.length * 48)}
            >
              <BarChart
                data={departmentData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E9EEF5"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatNumber(value)}
                />

                <Bar
                  dataKey="total"
                  name="Reports"
                  fill="#0D9488"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No department report data available." />
          )}
        </ChartPanel>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>Pukaar Admin Analytics</p>
        <p>Statistics retrieved from the application database.</p>
      </div>
    </div>
  );
}
