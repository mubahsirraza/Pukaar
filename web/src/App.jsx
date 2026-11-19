
import { useState } from "react";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AllReports from "./pages/AllReports";
import IssueMap from "./pages/IssueMap";

export default function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  };

  const handlePageChange = (page) => {
    setActivePage(page);
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
  <AllReports />
) : activePage === "Issue Map" ? (
  <IssueMap />
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
