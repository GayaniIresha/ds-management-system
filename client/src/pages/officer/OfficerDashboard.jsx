
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";

function OfficerDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    { title: "Pending Applications", count: 0, color: "#f59e0b" },
    { title: "Under Review", count: 0, color: "#3b82f6" },
    { title: "Reviewed Applications", count: 0, color: "#16a34a" },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const token = localStorage.getItem("dsmsToken");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/officer/applications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Applications load failed (${response.status})`
          );
        }

        const result = await response.json();

        // API එක array එකක් හෝ applications property එකක්
        // තුළ array එකක් ලබා දුන්නත් හඳුනාගැනීමට.
        const applications = Array.isArray(result)
          ? result
          : result.applications;

        if (!Array.isArray(applications)) {
          throw new Error("Invalid applications data received from API");
        }

        const pending = applications.filter(
          (app) => app.status === "Pending"
        ).length;

        const underReview = applications.filter(
          (app) => app.status === "Under Review"
        ).length;

        // Officer recommendation එක දී අවසන් කළ applications.
        const reviewed = applications.filter(
          (app) =>
            app.officer_recommendation === "Recommended for Approval" ||
            app.officer_recommendation === "Recommended for Rejection"
        ).length;

        setStats([
          {
            title: "Pending Applications",
            count: pending,
            color: "#f59e0b",
          },
          {
            title: "Under Review",
            count: underReview,
            color: "#3b82f6",
          },
          {
            title: "Reviewed Applications",
            count: reviewed,
            color: "#16a34a",
          },
        ]);

        setError("");
      } catch (err) {
        console.error("Officer dashboard error:", err);
        setError(err.message || "Dashboard data load failed.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, [navigate]);

  function handleLogout() {
    const confirmed = window.confirm("ඔබට Logout වීමට අවශ්‍යද?");

    if (!confirmed) return;

    localStorage.removeItem("dsmsToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("dsmsUser");

    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Officer Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome to the Divisional Secretariat Management System
          </p>
        </div>

        <div style={styles.headerActions}>
          <span style={styles.badge}>Officer Portal</span>
          <NotificationBell />

          <button
            type="button"
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout ↗
          </button>
        </div>
      </header>

      {loading && <p>Loading dashboard data...</p>}

      {error && (
        <p style={styles.error}>
          Dashboard data load failed: {error}
        </p>
      )}

      <section style={styles.cards}>
        {stats.map((stat) => (
          <div key={stat.title} style={styles.card}>
            <div
              style={{
                ...styles.indicator,
                backgroundColor: stat.color,
              }}
            />

            <p style={styles.cardTitle}>{stat.title}</p>
            <h2 style={styles.count}>{stat.count}</h2>
          </div>
        ))}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Application Management</h2>

        <p style={styles.panelText}>
          Review citizen applications, check submitted information,
          and record your recommendations.
        </p>

        <button
          type="button"
          style={styles.button}
          onClick={() => navigate("/officer/applications")}
        >
          View Applications →
        </button>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    backgroundColor: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "32px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  heading: {
    margin: 0,
    fontSize: "30px",
  },
  subtitle: {
    color: "#64748b",
    marginTop: "10px",
  },
  badge: {
    padding: "10px 16px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "20px",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  },
  indicator: {
    width: "42px",
    height: "5px",
    borderRadius: "5px",
  },
  cardTitle: {
    color: "#64748b",
    marginTop: "18px",
    marginBottom: "8px",
  },
  count: {
    fontSize: "32px",
    margin: 0,
  },
  panel: {
    backgroundColor: "#ffffff",
    padding: "28px",
    borderRadius: "14px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  },
  panelTitle: {
    marginTop: 0,
  },
  panelText: {
    color: "#64748b",
    lineHeight: 1.7,
  },
  button: {
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: "12px",
    borderRadius: "8px",
  },
};

export default OfficerDashboard;
