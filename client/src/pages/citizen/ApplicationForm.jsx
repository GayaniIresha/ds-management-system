
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

function ApplicationForm() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    service_id: "",
    fullName: "",
    nic: "",
    phone: "",
    address: "",
    description: "",
  });

  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/citizen/services",
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
          throw new Error(data.message || "Unable to load services.");
        }

        setServices(data.services || []);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the backend server."
            : err.message
        );
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("dsmsToken");

    if (!token) {
      navigate("/login");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/citizen/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
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
        throw new Error(data.message || "Application submission failed.");
      }

      alert(
        `Application submitted successfully!\nApplication Number: ${data.application.application_number}`
      );

      navigate("/citizen/applications");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that the backend is running."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d9e1ec",
    borderRadius: "8px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <Link
        to="/citizen/services"
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
        Back to Services
      </Link>

      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "32px",
          background: "#fff",
          border: "1px solid #e7edf5",
          borderRadius: "14px",
        }}
      >
        <h1 style={{ color: "#172b4d", marginTop: 0 }}>
          New Application
        </h1>

        <p style={{ color: "#64748b", marginBottom: "28px" }}>
          Complete the form to submit your application.
        </p>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {loadingServices ? (
          <p>Loading available services...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {[
              { label: "Full Name", name: "fullName", type: "text" },
              { label: "NIC Number", name: "nic", type: "text" },
              { label: "Phone Number", name: "phone", type: "tel" },
            ].map((field) => (
              <div key={field.name} style={{ marginBottom: "20px" }}>
                <label htmlFor={field.name} style={labelStyle}>
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="service_id" style={labelStyle}>
                Select Service
              </label>

              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                required
                disabled={services.length === 0}
                style={{ ...inputStyle, background: "#fff" }}
              >
                <option value="">Choose a service</option>

                {services.map((service) => (
                  <option
                    key={service.service_id}
                    value={service.service_id}
                  >
                    {service.service_name}
                  </option>
                ))}
              </select>

              {services.length === 0 && (
                <p style={{ color: "#b45309" }}>
                  No active services found. Please add services to the
                  database first.
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="address" style={labelStyle}>
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="description" style={labelStyle}>
                Additional Details
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || services.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 22px",
                background: submitting ? "#64748b" : "#174ea6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              <Send size={17} />
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}

        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "24px" }}>
          Submitted applications are stored in the database.
        </p>
      </div>
    </div>
  );
}

export default ApplicationForm;