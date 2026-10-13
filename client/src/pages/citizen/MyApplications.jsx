
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Eye } from "lucide-react";

function MyApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApplications() {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/citizen/applications",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("dsmsToken");
          localStorage.removeItem("dsmsUser");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load applications."
          );
        }

        setApplications(data.applications || []);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the server. Please check that the backend is running."
            : err.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [navigate]);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: {
        background: "#fff7ed",
        color: "#c2410c",
      },
      Approved: {
        background: "#dcfce7",
        color: "#166534",
      },
      Rejected: {
        background: "#fee2e2",
        color: "#b91c1c",
      },
      "Under Review": {
        background: "#dbeafe",
        color: "#1d4ed8",
      },
    };

    return (
      styles[status] || {
        background: "#f1f5f9",
        color: "#475569",
      }
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f7fb",
      }}
    >
      <Link
        to="/citizen/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "#174ea6",
          textDecoration: "none",
          marginBottom: "24px",
        }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px",
                color: "#172b4d",
              }}
            >
              My Applications
            </h1>

            <p style={{ margin: 0, color: "#64748b" }}>
              View and track your submitted applications.
            </p>
          </div>

          <Link
            to="/citizen/applications/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              background: "#174ea6",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <Plus size={18} />
            New Application
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "16px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e7edf5",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              Loading your applications...
            </div>
          ) : error ? (
            <div style={{ padding: "24px", color: "#64748b" }}>
              Unable to display applications. Please check the server
              and try refreshing the page.
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <FileText
                size={42}
                color="#94a3b8"
                style={{ marginBottom: "12px" }}
              />

              <h3 style={{ color: "#172b4d" }}>
                No Applications Yet
              </h3>

              <p style={{ color: "#64748b" }}>
                You have not submitted any applications yet.
              </p>

              <Link
                to="/citizen/applications/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                  padding: "11px 16px",
                  borderRadius: "8px",
                  background: "#174ea6",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                <Plus size={17} />
                Submit Your First Application
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {[
                      "Application Number",
                      "Service",
                      "Submitted Date",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: "16px",
                          color: "#475569",
                          fontSize: "13px",
                          borderBottom: "1px solid #e7edf5",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #edf1f7",
                          color: "#174ea6",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {application.application_number}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #edf1f7",
                          color: "#334155",
                        }}
                      >
                        {application.service_name}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #edf1f7",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(application.submitted_at)}
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #edf1f7",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            ...getStatusStyle(application.status),
                          }}
                        >
                          {application.status}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #edf1f7",
                        }}
                      >
                        <Link
                          to={`/citizen/applications/${application.application_id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "#174ea6",
                            textDecoration: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p
          style={{
            marginTop: "16px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          Showing applications retrieved from your account.
        </p>
      </div>
    </div>
  );
}

export default MyApplications;

