
import {
  SquaresFour,
  ClipboardText,
  MapTrifold,
  Buildings,
  Tag,
  GitBranch,
  ChartLineUp,
  UsersThree,
  GearSix,
  SignOut,
  Megaphone,
  X,
} from "@phosphor-icons/react";

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      { name: "Overview", icon: SquaresFour },
      { name: "All Reports", icon: ClipboardText },
      { name: "Issue Map", icon: MapTrifold },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Departments", icon: Buildings },
      { name: "Issue Categories", icon: Tag },
      { name: "Routing Rules", icon: GitBranch },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { name: "Analytics", icon: ChartLineUp },
      { name: "Citizens", icon: UsersThree },
    ],
  },
];

export default function Sidebar({
  activePage,
  setActivePage,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const handleNavigation = (page) => {
    setActivePage(page);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#081629]/60 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#10243E] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-in-out lg:z-40 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/[0.08] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30">
              <Megaphone size={25} weight="duotone" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-[0.13em]">
                PUKAAR
              </h1>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.17em] text-blue-200/60">
                CIVIC MANAGEMENT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-scrollbar flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-blue-200/40">
                {section.title}
              </p>

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.name;

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleNavigation(item.name)}
                      aria-current={active ? "page" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-950/30"
                          : "text-slate-300/80 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <Icon
                        size={21}
                        weight={active ? "fill" : "regular"}
                        className={
                          active
                            ? "text-white"
                            : "text-blue-200/65 group-hover:text-blue-200"
                        }
                      />

                      <span>{item.name}</span>

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-white/[0.08] p-4">
          <button
            type="button"
            onClick={() => handleNavigation("Settings")}
            aria-current={activePage === "Settings" ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition ${
              activePage === "Settings"
                ? "bg-blue-500 text-white"
                : "text-slate-300/80 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <GearSix size={21} />
            Settings
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <SignOut size={21} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
