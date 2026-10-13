
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/citizen/applications/${id}`,
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
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load application."
          );
        }

        if (!cancelled) {
          setApplication(data.application);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to the server."
              : err.message
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const details = application?.application_data || {};

  const statusColors = {
    Pending: { background: "#fff7ed", color: "#c2410c" },
    Approved: { background: "#dcfce7", color: "#166534" },
    Rejected: { background: "#fee2e2", color: "#b91c1c" },
    "Under Review": { background: "#dbeafe", color: "#1d4ed8" },
  };

  const statusStyle = statusColors[application?.status] || {
    background: "#f1f5f9",
    color: "#475569",
  };

  const rows = [
    ["Full Name", details.fullName],
    ["NIC Number", details.nic],
    ["Phone Number", details.phone],
    ["Address", details.address],
    ["Description", details.description],
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f7fb",
      }}
    >
      <Link
        to="/citizen/applications"
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
        Back to My Applications
      </Link>

      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          background: "#fff",
          padding: "32px",
          borderRadius: "14px",
          border: "1px solid #e7edf5",
        }}
      >
        {loading ? (
          <p>Loading application details...</p>
        ) : error ? (
          <div role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : !application ? (
          <p>Application not found.</p>
        ) : (
          <>
            <FileText size={34} color="#174ea6" />

            <h1 style={{ color: "#172b4d", marginBottom: "8px" }}>
              Application Details
            </h1>

            <p style={{ color: "#64748b" }}>
              Application ID: {application.application_id}
            </p>

            <div
              style={{
                padding: "20px",
                marginTop: "24px",
                background: "#f8fafc",
                borderRadius: "10px",
              }}
            >
              <p>
                <strong>Application Number:</strong>{" "}
                {application.application_number}
              </p>

              <p>
                <strong>Service:</strong>{" "}
                {application.service_name}
              </p>

              <p>
                <strong>Submitted Date:</strong>{" "}
                {formatDate(application.submitted_at)}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    ...statusStyle,
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {application.status}
                </span>
              </p>
            </div>

            <h2 style={{ color: "#172b4d", marginTop: "28px" }}>
              Submitted Information
            </h2>

            <div
              style={{
                border: "1px solid #e7edf5",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(130px, 1fr) 2fr",
                    gap: "16px",
                    padding: "15px",
                    borderBottom: "1px solid #edf1f7",
                  }}
                >
                  <strong style={{ color: "#475569" }}>
                    {label}
                  </strong>

                  <span
                    style={{
                      color: "#334155",
                      overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {value || "-"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ApplicationDetails;