
import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../CitizenDashboard.css";

function CitizenDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        setError("Please sign in to view your dashboard.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/citizen/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("dsmsToken");
          localStorage.removeItem("dsmsUser");
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load dashboard."
          );
        }

        setUser(data.user);
        setStats(data.stats);
        setApplications(data.applications);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the server. Please check the backend."
            : err.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Pending Applications",
      value: stats.pendingApplications,
      icon: Clock,
      color: "orange",
    },
    {
      title: "Approved Applications",
      value: stats.approvedApplications,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Rejected Applications",
      value: stats.rejectedApplications,
      icon: XCircle,
      color: "red",
    },
  ];

  return (
    <div className="citizen-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="citizen-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="citizen-dashboard">
          <header className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">
                CITIZEN PORTAL
              </p>

              <h1>
                {user
                  ? `Welcome Back, ${user.full_name}!`
                  : "Welcome Back!"}
              </h1>

              <p className="dashboard-description">
                Manage your applications and access government services.
              </p>
            </div>

            <Link
              to="/citizen/services"
              className="new-application-btn"
            >
              <PlusCircle size={18} />
              New Application
            </Link>
          </header>

          {loading && (
            <p role="status">Loading your dashboard...</p>
          )}

          {!loading && error && (
            <p role="alert">{error}</p>
          )}

          {!loading && !error && (
            <>
              <section className="dashboard-stats">
                {statCards.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      className="stat-card"
                      key={stat.title}
                    >
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon size={23} />
                      </div>

                      <div>
                        <p>{stat.title}</p>
                        <h2>{stat.value}</h2>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="applications-panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent Applications</h2>
                    <p>
                      Track the progress of your latest applications.
                    </p>
                  </div>

                  <Link
                    to="/citizen/applications"
                    className="view-all-link"
                  >
                    View All <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Service</th>
                        <th>Submitted Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {applications.length > 0 ? (
                        applications.map((application) => (
                          <tr
                            key={application.application_number}
                          >
                            <td>
                              {application.application_number}
                            </td>
                            <td>{application.service_name}</td>
                            <td>
                              {application.submitted_at
                                ? new Date(
                                    application.submitted_at
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              <span
                                className={`application-status ${
                                  String(application.status)
                                    .toLowerCase()
                                    .replaceAll(" ", "-")
                                }`}
                              >
                                {application.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4">
                            You have no applications yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <p className="dashboard-notice">
                Application information is loaded from your account.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CitizenDashboard;