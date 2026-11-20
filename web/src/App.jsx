
import { useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AllReports from "./pages/AllReports";
import IssueMap from "./pages/IssueMap";
import Departments from "./pages/Departments";
import IssueCategories from "./pages/IssueCategories";
import RoutingRules from "./pages/RoutingRules";
import Analytics from "./pages/Analytics";
import Citizens from "./pages/Citizens";

export default function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shared filter request for Analytics -> All Reports navigation
  const [reportFilter, setReportFilter] = useState({
    status: "",
    requestId: 0,
  });

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("pukaarToken");
    const savedUser = localStorage.getItem("pukaarUser");

    if (!token || !savedUser) return null;

    try {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser.role !== "ADMIN") return null;

      return parsedUser;
    } catch {
      return null;
    }
  });

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setActivePage("Overview");
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("pukaarToken");
    localStorage.removeItem("pukaarUser");

    setUser(null);
    setActivePage("Overview");
    setSidebarOpen(false);
    setReportFilter({ status: "", requestId: 0 });
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false);

    // Opening All Reports directly from the sidebar clears
    // any filter previously selected from Analytics.
    if (page === "All Reports") {
      setReportFilter((current) => ({
        status: "",
        requestId: current.requestId + 1,
      }));
    }
  };

  const handleAnalyticsNavigateToReports = (status = "") => {
    setReportFilter((current) => ({
      status,
      requestId: current.requestId + 1,
    }));

    setActivePage("All Reports");
    setSidebarOpen(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <Sidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen min-w-0 lg:ml-64">
        <Header
          activePage={activePage}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {activePage === "Overview" ? (
            <Dashboard />
          ) : activePage === "All Reports" ? (
            <AllReports filterRequest={reportFilter} />
          ) : activePage === "Issue Map" ? (
            <IssueMap />
          ) : activePage === "Departments" ? (
            <Departments />
          ) : activePage === "Issue Categories" ? (
            <IssueCategories />
          ) : activePage === "Routing Rules" ? (
            <RoutingRules />
         ) : activePage === "Analytics" ? (
  <Analytics
    onNavigateToReports={handleAnalyticsNavigateToReports}
  />
) : activePage === "Citizens" ? (
  <Citizens />
) : (
            <div className="dashboard-card rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-[#10243E]">
                {activePage}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                This module will be implemented in the next development phase.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
