import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../CitizenDashboard.css";
import "./MyDocuments.css";

const API = "http://localhost:5000";

function MyDocuments() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadDocuments() {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [applicationsResponse, certificatesResponse] = await Promise.all([
          fetch(`${API}/api/citizen/applications`, { headers }),
          fetch(`${API}/api/citizen/certificates`, { headers }),
        ]);
        const [data, certificateData] = await Promise.all([
          applicationsResponse.json(),
          certificatesResponse.json(),
        ]);

        if (
          applicationsResponse.status === 401 ||
          certificatesResponse.status === 401
        ) {
          localStorage.removeItem("dsmsToken");
          localStorage.removeItem("dsmsUser");
          navigate("/login", { replace: true });
          return;
        }

        if (!applicationsResponse.ok || !certificatesResponse.ok) {
          throw new Error(
            data.message ||
              certificateData.message ||
              "Unable to load your documents."
          );
        }

        setDocuments(
          (data.applications || []).filter(
            (application) =>
              String(application.status).toLowerCase() === "approved"
          )
        );
        setCertificates(certificateData.applications || []);
      } catch (loadError) {
        setError(
          loadError.message === "Failed to fetch"
            ? "Cannot connect to the server. Check that the backend is running."
            : loadError.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [navigate]);

  async function downloadDocument(application) {
    setDownloadingId(application.application_id);
    setDownloadError("");

    try {
      const token = localStorage.getItem("dsmsToken");
      const response = await fetch(
        `${API}/api/citizen/applications/${application.application_id}/certificate.pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "The document could not be downloaded.");
      }

      const pdfBlob = await response.blob();
      const objectUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      const safeNumber = String(application.application_number).replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      link.href = objectUrl;
      link.download = `DSMS-${safeNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again when it is available."
          : downloadFailure.message
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function downloadCertificate(certificate) {
    setDownloadingId(`certificate-${certificate.certificate_id}`);
    setDownloadError("");

    try {
      const token = localStorage.getItem("dsmsToken");
      const response = await fetch(
        `${API}/api/citizen/certificates/${certificate.certificate_id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "The certificate could not be downloaded.");
      }

      const objectUrl = window.URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${certificate.certificate_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again when it is available."
          : downloadFailure.message
      );
    } finally {
      setDownloadingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "Date not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date not recorded"
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  const issuedCertificates = certificates.filter(
    (application) => application.certificate_id
  );

  return (
    <div className="citizen-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="citizen-main">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="citizen-dashboard documents-page">
          <header className="documents-header">
            <div>
              <p className="dashboard-eyebrow">CITIZEN PORTAL</p>
              <h1>My Documents</h1>
              <p className="dashboard-description">
                Approved application records and certificates issued through DSMS.
              </p>
            </div>
            <Link to="/citizen/applications" className="documents-back-link">
              <FileText size={17} />
              My Applications
            </Link>
          </header>

          <div className="documents-notice" role="note">
            <BadgeCheck size={19} />
            <p>
              Application records are system-generated. Certificates shown below
              have been issued through the DSMS administrator workflow; public
              verification confirms the DSMS record only, not external government authorization.
            </p>
          </div>

          {downloadError && (
            <div className="documents-error" role="alert">
              {downloadError}
            </div>
          )}

          {loading ? (
            <div className="documents-state" role="status">
              <RefreshCw className="documents-spinner" size={22} />
              <p>Loading your approved documents...</p>
            </div>
          ) : error ? (
            <div className="documents-state documents-state-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="documents-retry"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="documents-state documents-empty">
              <span className="documents-empty-icon">
                <FileText size={27} />
              </span>
              <h2>No approved documents yet</h2>
              <p>
                Documents appear here when one of your applications is
                approved.
              </p>
              <Link to="/citizen/applications" className="documents-empty-link">
                View applications
              </Link>
            </div>
          ) : (
            <>
              <section className="documents-section" aria-label="Approved application records">
                <div className="documents-list-heading">
                  <h2>Approved application records</h2>
                  <span>{documents.length}</span>
                </div>
                <div className="documents-grid">
                  {documents.map((application) => (
                    <article className="document-item" key={application.application_id}>
                      <div className="document-item-top">
                        <span className="document-icon"><FileText size={21} /></span>
                        <span className="document-approved"><BadgeCheck size={15} />Approved</span>
                      </div>
                      <h3>{application.service_name}</h3>
                      <p className="document-number">{application.application_number}</p>
                      <div className="document-meta">
                        <CalendarDays size={16} />
                        <span>Application date</span>
                        <strong>{formatDate(application.submitted_at)}</strong>
                      </div>
                      <button
                        type="button"
                        className="document-download document-record-download"
                        disabled={downloadingId === application.application_id}
                        onClick={() => downloadDocument(application)}
                      >
                        <Download size={17} />
                        {downloadingId === application.application_id
                          ? "Preparing PDF..."
                          : "Download application record"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="documents-section issued-certificates-section" aria-label="Issued certificates">
                <div className="documents-list-heading">
                  <h2>Certificates issued through DSMS</h2>
                  <span>{issuedCertificates.length}</span>
                </div>
                {issuedCertificates.length === 0 ? (
                  <div className="certificates-empty">
                    No certificates have been issued for your approved applications.
                  </div>
                ) : (
                  <div className="documents-grid">
                    {issuedCertificates.map((certificate) => (
                      <article className="document-item issued-certificate-item" key={certificate.certificate_id}>
                        <div className="document-item-top">
                          <span className="document-icon"><BadgeCheck size={21} /></span>
                          <span className="certificate-issued-status">Issued</span>
                        </div>
                        <h3>{certificate.service_name}</h3>
                        <p className="document-number">{certificate.certificate_number}</p>
                        <div className="document-meta">
                          <CalendarDays size={16} />
                          <span>Issue date</span>
                          <strong>{formatDate(certificate.issued_at)}</strong>
                        </div>
                        <button
                          type="button"
                          className="document-download"
                          disabled={downloadingId === `certificate-${certificate.certificate_id}`}
                          onClick={() => downloadCertificate(certificate)}
                        >
                          <Download size={17} />
                          {downloadingId === `certificate-${certificate.certificate_id}`
                            ? "Preparing PDF..."
                            : "Download Certificate"}
                        </button>
                        <Link
                          className="certificate-verify-link"
                          to={`/certificates/verify/${certificate.certificate_number}`}
                        >
                          Verify certificate record
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default MyDocuments;