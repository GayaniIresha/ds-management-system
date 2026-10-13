
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  LogOut,
  Award,
} from "lucide-react";
import NotificationBell from "../../components/NotificationBell";

const API = "http://localhost:5000/api";

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficers, setSelectedOfficers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API}/admin/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        navigate("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error(
          "Admin access only. Please sign in with an admin account."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load applications."
        );
      }

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data.applications)
        ? data.applications
        : [];

      setApplications(records);
      const officersResponse = await fetch(`${API}/admin/officers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const officersData = await officersResponse.json().catch(() => ({}));
      if (!officersResponse.ok) {
        throw new Error(
          officersData.message || "Unable to load officer accounts."
        );
      }
      setOfficers(officersData.officers || []);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadApplications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  async function assignOfficer(applicationId) {
    const officerId = selectedOfficers[applicationId];
    if (!officerId) {
      setError("Select an officer before assigning this application.");
      return;
    }

    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("dsmsToken");
      const response = await fetch(
        `${API}/admin/applications/${applicationId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ officer_id: Number(officerId) }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to assign application.");
      }

      const officer = officers.find(
        (item) => String(item.user_id) === String(officerId)
      );
      setApplications((previous) =>
        previous.map((application) =>
          String(application.application_id) === String(applicationId)
            ? {
                ...application,
                assigned_officer_id: Number(officerId),
                assigned_officer_name: officer?.full_name || "",
              }
            : application
        )
      );
      setMessage(data.message || "Application assigned successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to assign application.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateStatus(id, status) {
    const application = applications.find(
      (app) => String(app.application_id) === String(id)
    );

    if (!application) {
      setError("Application එක හමු වුණේ නැහැ.");
      return;
    }

    if (
      application.status !== "Under Review" ||
      !application.officer_recommendation
    ) {
      setError(
        "Admin decision එක ගැනීමට පෙර Officer recommendation එකක් තිබිය යුතුයි."
      );
      return;
    }

    const action = status.toLowerCase();

    const confirmed = window.confirm(
      `Officer recommendation: ${application.officer_recommendation}\n\n` +
        `Review note: ${application.officer_review_note || "No note"}\n\n` +
        `මෙම application එක ${action} කරන්නද?`
    );

    if (!confirmed) return;

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API}/admin/applications/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update application status."
        );
      }

      setMessage(
        `Application එක සාර්ථකව ${status} කළා.`
      );

      await loadApplications();
    } catch (err) {
      setError(
        err.message || "Unable to update application."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("dsmsToken");
    localStorage.removeItem("dsmsUser");
    navigate("/login");
  }

  const pending = applications.filter(
    (app) =>
      app.status === "Pending" ||
      app.status === "Under Review"
  ).length;

  const approved = applications.filter(
    (app) => app.status === "Approved"
  ).length;

  const rejected = applications.filter(
    (app) => app.status === "Rejected"
  ).length;

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      icon: FileText,
      className: "stat-total",
    },
    {
      label: "Pending / Under Review",
      value: pending,
      icon: Clock,
      className: "stat-pending",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle,
      className: "stat-approved",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      className: "stat-rejected",
    },
  ];

  function statusClass(status) {
    if (status === "Approved") return "status-approved";
    if (status === "Rejected") return "status-rejected";
    return "status-pending";
  }

  return (
    <div className="min-h-screen bg-slate-50 admin-dashboard">
      <header className="bg-white border-b border-slate-200 admin-header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 admin-header-inner">
          <div className="flex items-center gap-3 admin-brand">
            <div className="bg-blue-700 text-white p-2 rounded-lg admin-brand-icon">
              <LayoutDashboard size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800">
                DSMS Admin
              </h1>
              <p className="text-sm text-slate-500">
                Application Management
              </p>
            </div>
          </div>

          <nav
            className="admin-header-actions"
            aria-label="Admin navigation"
          >
            <NotificationBell />
            <Link
              to="/admin/certificates"
              className="admin-header-button"
            >
              <Award size={17} />
              <span>Certificates</span>
            </Link>

            <button
              type="button"
              onClick={loadApplications}
              disabled={loading}
              className="admin-header-button"
            >
              <RefreshCw
                size={17}
                className={loading ? "admin-spin" : ""}
              />
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="admin-logout-button"
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 admin-main">
        <section className="admin-page-heading">
          <p className="admin-eyebrow">ADMINISTRATION</p>

          <h2 className="text-2xl font-bold text-slate-800">
            Admin Dashboard
          </h2>

          <p className="text-slate-500 mt-1">
            Review officer recommendations and make the final
            decision on citizen applications.
          </p>
        </section>

        {error && (
          <div className="admin-error" role="alert">
            <XCircle size={20} />
            <span>{error}</span>

            <button
              type="button"
              className="admin-error-retry"
              onClick={loadApplications}
            >
              Try again
            </button>
          </div>
        )}

        {message && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              borderRadius: "9px",
              background: "#dcfce7",
              color: "#166534",
            }}
          >
            {message}
          </div>
        )}

        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 admin-stats-grid"
          aria-label="Application statistics"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm admin-stat-card ${stat.className}`}
              >
                <div className="admin-stat-top">
                  <p className="text-sm text-slate-500">
                    {stat.label}
                  </p>

                  <div className="admin-stat-icon">
                    <Icon size={22} />
                  </div>
                </div>

                <p className="text-3xl font-bold text-slate-800 mt-3 admin-stat-value">
                  {loading ? "—" : stat.value}
                </p>

                <p className="admin-stat-caption">
                  {stat.label === "Total Applications"
                    ? "All submitted applications"
                    : stat.label === "Pending / Under Review"
                    ? "Waiting for review or final decision"
                    : stat.label === "Approved"
                    ? "Successfully approved"
                    : "Applications declined"}
                </p>
              </article>
            );
          })}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden admin-applications-panel">
          <div className="p-5 border-b border-slate-200 admin-panel-heading">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Citizen Applications
              </h3>

              <p className="admin-panel-subtitle">
                Review officer notes and make final decisions.
              </p>
            </div>

            <span className="admin-total-badge">
              {applications.length} total
            </span>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <span className="admin-loading-spinner" />
              <p>Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={36} />
              <h4>No applications yet</h4>
              <p>
                Citizen applications will appear here when submitted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto admin-table-wrapper">
              <table className="w-full text-sm text-left admin-table">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th>Application No.</th>
                    <th>Citizen</th>
                    <th>Service</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Assigned Officer</th>
                    <th>Officer Recommendation</th>
                    <th>Review Note</th>
                    <th>Admin Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((app) => {
                    const hasRecommendation =
                      app.status === "Under Review" &&
                      [
                        "Recommended for Approval",
                        "Recommended for Rejection",
                      ].includes(app.officer_recommendation);

                    const isUpdating =
                      String(updatingId) ===
                      String(app.application_id);

                    return (
                      <tr key={app.application_id}>
                        <td className="admin-application-number">
                          {app.application_number || app.application_id}
                        </td>

                        <td>
                          <div className="admin-citizen-name">
                            {app.citizen_name || "Citizen"}
                          </div>

                          <div className="admin-citizen-email">
                            {app.citizen_email || "—"}
                          </div>
                        </td>

                        <td>{app.service_name || "—"}</td>

                        <td className="admin-date-cell">
                          {app.submitted_at
                            ? new Date(
                                app.submitted_at
                              ).toLocaleDateString("en-GB")
                            : "—"}
                        </td>

                        <td>
                          <span
                            className={`admin-status-badge ${statusClass(
                              app.status
                            )}`}
                          >
                            {app.status || "Unknown"}
                          </span>
                        </td>

                        <td className="admin-assignment-cell">
                          <div className="admin-assignment-control">
                            <select
                              value={
                                selectedOfficers[app.application_id] ||
                                app.assigned_officer_id ||
                                ""
                              }
                              onChange={(event) =>
                                setSelectedOfficers((previous) => ({
                                  ...previous,
                                  [app.application_id]: event.target.value,
                                }))
                              }
                              aria-label={`Assign ${app.application_number} to an officer`}
                              className="admin-assignment-select"
                            >
                              <option value="">Select officer</option>
                              {officers.map((officer) => (
                                <option
                                  key={officer.user_id}
                                  value={officer.user_id}
                                >
                                  {officer.full_name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="admin-assign-button"
                              onClick={() =>
                                assignOfficer(app.application_id)
                              }
                              disabled={
                                isUpdating ||
                                !selectedOfficers[app.application_id] ||
                                String(
                                  selectedOfficers[app.application_id]
                                ) === String(app.assigned_officer_id || "")
                              }
                            >
                              {isUpdating
                                ? "Assigning..."
                                : app.assigned_officer_id
                                  ? "Reassign"
                                  : "Assign"}
                            </button>
                          </div>
                          <small>
                            {app.assigned_officer_name
                              ? `Assigned to ${app.assigned_officer_name}`
                              : "Not assigned"}
                          </small>
                        </td>

                        <td>
                          {app.officer_recommendation || (
                            <span className="admin-completed-label">
                              Awaiting officer review
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            minWidth: "220px",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {app.officer_review_note || "—"}
                        </td>

                        <td>
                          {hasRecommendation ? (
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    app.application_id,
                                    "Approved"
                                  )
                                }
                                className="admin-approve-button"
                              >
                                <CheckCircle size={15} />
                                {isUpdating ? "Saving..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(
                                    app.application_id,
                                    "Rejected"
                                  )
                                }
                                className="admin-reject-button"
                              >
                                <XCircle size={15} />
                                {isUpdating ? "Saving..." : "Reject"}
                              </button>
                            </div>
                          ) : ["Approved", "Rejected"].includes(
                              app.status
                            ) ? (
                            <span className="admin-completed-label">
                              <CheckCircle size={15} />
                              Final decision made
                            </span>
                          ) : (
                            <span className="admin-completed-label">
                              Awaiting officer recommendation
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-dashboard-footer">
          <Link
            to="/citizen/dashboard"
            className="admin-back-link"
          >
            Back to main site
          </Link>

          <span>DSMS · Application Management</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
