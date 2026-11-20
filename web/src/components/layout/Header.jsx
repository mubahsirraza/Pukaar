
import {
  List,
  CaretRight,
  CaretDown,
  UserCircle,
  ShieldCheck,
} from "@phosphor-icons/react";

const pageDescriptions = {
  Overview: "Monitor platform activity and key performance indicators.",
  "All Reports": "Review, verify, and manage citizen-submitted reports.",
  "Issue Map": "Explore reported civic issues across the community.",
  Departments: "Manage departments responsible for resolving civic issues.",
  "Issue Categories": "Configure the categories used to classify reports.",
  "Routing Rules": "Manage how reports are assigned to departments.",
  Analytics: "Explore reporting trends and platform performance.",
  Citizens: "View and manage registered citizen accounts.",
  Settings: "Manage administrative platform preferences.",
};

function getInitials(name) {
  if (!name) return "AD";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Header({
  activePage,
  user,
  onMenuClick,
}) {
  const adminName = user?.name || "Administrator";
  const adminEmail = user?.email || "Administrator account";
  const initials = getInitials(adminName);

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Page information */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
        >
          <List size={25} weight="bold" />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[#172B45] sm:text-xl">
            {activePage}
          </h2>

          <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
            <span className="shrink-0">Pukaar</span>
            <CaretRight size={11} />
            <span className="shrink-0">Admin Portal</span>
            <CaretRight size={11} />
            <span className="truncate text-slate-500">{activePage}</span>
          </div>

          <p className="mt-1 hidden text-xs text-slate-400 md:block">
            {pageDescriptions[activePage] || "Manage your Pukaar platform."}
          </p>
        </div>
      </div>

      {/* Administrator profile */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 sm:flex">
          <ShieldCheck size={20} weight="duotone" />
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="max-w-[160px] truncate text-sm font-semibold text-[#172B45]">
            {adminName}
          </p>
          <p className="max-w-[160px] truncate text-xs text-slate-400">
            {adminEmail}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 sm:hidden">
          {initials}
        </div>

        <CaretDown
          size={16}
          className="hidden text-slate-400 sm:block"
        />
      </div>
    </header>
  );
}
