import {
  FileText,
  ClockCountdown,
  CheckCircle,
  WarningCircle,
  ArrowUpRight,
  DotsThree,
  TrendUp,
  Pulse,
} from "@phosphor-icons/react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const statistics = [
  {
    title: "Total Reports",
    value: "1,284",
    description: "Community submissions",
    change: "+12.5%",
    icon: FileText,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    title: "Pending Verification",
    value: "186",
    description: "Awaiting admin review",
    change: "Needs attention",
    icon: ClockCountdown,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    title: "Resolved Issues",
    value: "847",
    description: "Successfully completed",
    change: "+8.2%",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    title: "High Severity",
    value: "42",
    description: "Priority cases",
    change: "Priority review",
    icon: WarningCircle,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
  },
];

const reportTrends = [
  { month: "Jan", reports: 80, resolved: 45 },
  { month: "Feb", reports: 110, resolved: 65 },
  { month: "Mar", reports: 95, resolved: 72 },
  { month: "Apr", reports: 140, resolved: 90 },
  { month: "May", reports: 125, resolved: 100 },
  { month: "Jun", reports: 170, resolved: 125 },
  { month: "Jul", reports: 155, resolved: 130 },
];

const categoryData = [
  { name: "Roads", reports: 85 },
  { name: "Sanitation", reports: 68 },
  { name: "Water", reports: 52 },
  { name: "Electricity", reports: 41 },
  { name: "Drainage", reports: 34 },
];

const recentReports = [
  {
    id: "PUK-1024",
    issue: "Damaged road near Main Market",
    category: "Roads",
    severity: "High",
    status: "Pending Verification",
    date: "19 Nov 2026",
  },
  {
    id: "PUK-1023",
    issue: "Overflowing garbage container",
    category: "Sanitation",
    severity: "Medium",
    status: "In Progress",
    date: "19 Nov 2026",
  },
  {
    id: "PUK-1022",
    issue: "Streetlight not working",
    category: "Electricity",
    severity: "Low",
    status: "Resolved",
    date: "18 Nov 2026",
  },
  {
    id: "PUK-1021",
    issue: "Water leakage on street",
    category: "Water",
    severity: "High",
    status: "Pending Verification",
    date: "18 Nov 2026",
  },
];

function StatusBadge({ status }) {
  const styles = {
    "Pending Verification": "bg-amber-50 text-amber-700 ring-amber-200",
    "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
    Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        styles[status] || "bg-slate-50 text-slate-600 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    High: "text-rose-600",
    Medium: "text-amber-600",
    Low: "text-emerald-600",
  };

  return (
    <span className={`text-xs font-semibold ${styles[severity] || "text-slate-500"}`}>
      {severity}
    </span>
  );
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="dashboard-card p-5 transition duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
          <Icon size={23} weight="duotone" />
        </div>

        <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <DotsThree size={22} />
        </button>
      </div>

      <p className="mt-5 text-[13px] font-medium text-slate-500">
        {item.title}
      </p>

      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-[30px] font-bold tracking-tight text-[#172B45]">
          {item.value}
        </h3>

        <span className="mb-1 text-[11px] font-semibold text-slate-500">
          {item.change}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">{item.description}</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-7">

      {/* Welcome section */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">
              Administration Overview
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#172B45]">
            Welcome back, Administrator
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Here's what's happening across your community today.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700">
          <Pulse size={19} weight="bold" />
          Generate Report
        </button>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </section>

      {/* Analytics */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Report activity chart */}
        <div className="dashboard-card p-6 xl:col-span-2">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172B45]">
                Report Activity
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Monthly submissions and issue resolutions
              </p>
            </div>

            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-400">
              <option>Last 7 months</option>
              <option>Last 12 months</option>
            </select>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={reportTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#93C5FD" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#EDF1F7" strokeDasharray="4 4" vertical={false} />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E8EDF5",
                    boxShadow: "0 8px 25px rgba(15,35,65,0.08)",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="reports"
                  name="Reports submitted"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#reportsFill)"
                  activeDot={{ r: 5 }}
                />

                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Reports resolved"
                  stroke="#60A5FA"
                  strokeWidth={2.5}
                  fill="url(#resolvedFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Reports submitted
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
              Reports resolved
            </div>
          </div>
        </div>

        {/* Category chart */}
        <div className="dashboard-card p-6">
          <div>
            <h3 className="text-base font-bold text-[#172B45]">
              Reports by Category
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Distribution of reported issues
            </p>
          </div>

          <div className="mt-7 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#EDF1F7"
                  strokeDasharray="4 4"
                  horizontal={false}
                />

                <XAxis type="number" hide />

                <YAxis
                  dataKey="name"
                  type="category"
                  width={85}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E8EDF5",
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="reports"
                  name="Reports"
                  fill="#2563EB"
                  radius={[0, 6, 6, 0]}
                  barSize={17}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent reports */}
      <section className="dashboard-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-[#172B45]">
              Recent Reports
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Latest community issue submissions
            </p>
          </div>

          <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">
            View all reports
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#F8FAFD]">
              <tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <th className="px-6 py-4">Report ID</th>
                <th className="px-6 py-4">Issue Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <tr
                  key={report.id}
                  className="transition hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-blue-600">
                    {report.id}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-[13px] font-medium text-slate-700">
                    {report.issue}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                    {report.category}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <SeverityBadge severity={report.severity} />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={report.status} />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-400">
                    {report.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">
          Showing {recentReports.length} demonstration records
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 pb-3 text-[11px] text-slate-400">
        <TrendUp size={15} />
        Pukaar Administration System
        <span>•</span>
        Demonstration data
      </div>
    </div>
  );
}
