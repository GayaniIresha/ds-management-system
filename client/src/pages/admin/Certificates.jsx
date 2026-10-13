import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, BadgeCheck, Download, Eye, RefreshCw, X } from "lucide-react";
import "./AdminDashboard.css";
import "./Certificates.css";

const API = "http://localhost:5000";

function Certificates() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [issueTarget, setIssueTarget] = useState(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      try {
        const token = localStorage.getItem("dsmsToken");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await fetch(`${API}/api/admin/certificates`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("dsmsToken");
          localStorage.removeItem("dsmsUser");
          navigate("/login", { replace: true });
          return;
        }
        if (response.status === 403) {
          throw new Error("Admin access only. Sign in with an administrator account.");
        }
        if (!response.ok) throw new Error(data.message || "Unable to load certificates.");

        setApplications(data.applications || []);
        setError("");
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Unable to load certificates.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadApplications();
    return () => controller.abort();
  }, [navigate, refreshKey]);

  async function issueCertificate(event) {
    event.preventDefault();
    if (!issueTarget || !verificationConfirmed || verificationNote.trim().length < 10) return;

    setIssuing(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/api/admin/applications/${issueTarget.application_id}/certificate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("dsmsToken")}`,
          },
          body: JSON.stringify({
            verification_note: verificationNote.trim(),
            verification_confirmed: verificationConfirmed,
          }),
        }
      );
      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        navigate("/login", { replace: true });
        return;
      }
      if (response.status === 403) throw new Error("Only administrators can issue certificates.");
      if (!response.ok) throw new Error(data.message || "Certificate issuance failed.");

      setNotice(`Issued certificate ${data.certificate.certificate_number}.`);
      setIssueTarget(null);
      setVerificationNote("");
      setVerificationConfirmed(false);
      setRefreshKey((value) => value + 1);
    } catch (issueError) {
      setError(issueError.message || "Certificate issuance failed.");
    } finally {
      setIssuing(false);
    }
  }

  async function showDetails(certificateId) {
    setDetailsLoading(true);
    setDetails(null);
    setError("");
    try {
      const response = await fetch(`${API}/api/admin/certificates/${certificateId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("dsmsToken")}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load certificate details.");
      setDetails(data.certificate);
    } catch (detailsError) {
      setError(detailsError.message || "Unable to load certificate details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function downloadCertificate(certificateId, certificateNumber) {
    setDownloadingId(certificateId);
    setError("");
    try {
      const response = await fetch(`${API}/api/admin/certificates/${certificateId}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("dsmsToken")}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to download the certificate.");
      }
      const objectUrl = window.URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError.message || "Unable to download the certificate.");
    } finally {
      setDownloadingId(null);
    }
  }

  function closeIssueDialog() {
    if (issuing) return;
    setIssueTarget(null);
    setVerificationNote("");
    setVerificationConfirmed(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 certificate-admin-page">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="certificate-admin-brand">
            <Award size={24} />
            <div>
              <h1>Certificate Management</h1>
              <p>Approved applications and issued certificate records</p>
            </div>
          </div>
          <div className="certificate-admin-actions">
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>
              <RefreshCw size={16} /> Refresh
            </button>
            <Link to="/admin/dashboard"><ArrowLeft size={16} /> Admin dashboard</Link>
          </div>
        </div>
      </header>

      <main className="certificate-admin-main">
        <div className="certificate-admin-intro">
          <div>
            <p className="certificate-admin-eyebrow">ADMINISTRATION</p>
            <h2>Certificate issuance</h2>
            <p>Verify each approved application before recording a single, non-reissuable DSMS certificate.</p>
          </div>
          <div className="certificate-count"><strong>{applications.length}</strong><span>Approved applications</span></div>
        </div>

        <div className="certificate-admin-disclaimer" role="note">
          Certificates are issued through the DSMS administrator workflow. Verification confirms the DSMS record only; this system does not assert external government endorsement.
        </div>

        {notice && <div className="certificate-admin-notice" role="status">{notice}</div>}
        {error && <div className="certificate-admin-error" role="alert">{error}</div>}

        <section className="certificate-admin-list" aria-label="Approved applications">
          {loading ? (
            <div className="certificate-admin-state" role="status"><RefreshCw className="documents-spinner" size={20} />Loading certificate records...</div>
          ) : error && applications.length === 0 ? (
            <div className="certificate-admin-state">Unable to load the certificate list.</div>
          ) : applications.length === 0 ? (
            <div className="certificate-admin-state">There are no approved applications to manage.</div>
          ) : (
            <div className="certificate-admin-table-wrap">
              <table className="certificate-admin-table">
                <thead>
                  <tr><th>Application</th><th>Citizen</th><th>Service</th><th>Submitted</th><th>Certificate</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.application_id}>
                      <td><strong>{application.application_number}</strong></td>
                      <td>{application.citizen_name}</td>
                      <td>{application.service_name}</td>
                      <td>{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString("en-GB") : "Not recorded"}</td>
                      <td>
                        {application.certificate_id ? (
                          <div className="certificate-admin-issued">
                            <span><BadgeCheck size={15} /> Issued</span>
                            <small>{application.certificate_number}</small>
                            <small>{application.issued_at ? new Date(application.issued_at).toLocaleDateString("en-GB") : "Date unavailable"}</small>
                          </div>
                        ) : <span className="certificate-admin-pending">Not issued</span>}
                      </td>
                      <td>
                        {application.certificate_id ? (
                          <div className="certificate-row-actions">
                            <button type="button" onClick={() => showDetails(application.certificate_id)}><Eye size={15} /> Details</button>
                            <button type="button" disabled={downloadingId === application.certificate_id} onClick={() => downloadCertificate(application.certificate_id, application.certificate_number)}><Download size={15} /> PDF</button>
                          </div>
                        ) : (
                          <button type="button" className="certificate-issue-button" onClick={() => setIssueTarget(application)}><Award size={15} /> Verify &amp; issue</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {issueTarget && (
        <div className="certificate-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeIssueDialog(); }}>
          <section className="certificate-dialog" role="dialog" aria-modal="true" aria-labelledby="issue-certificate-title">
            <button className="certificate-dialog-close" type="button" aria-label="Close dialog" onClick={closeIssueDialog}><X size={17} /></button>
            <p className="certificate-admin-eyebrow">APPLICATION VERIFICATION</p>
            <h2 id="issue-certificate-title">Issue DSMS certificate</h2>
            <dl className="certificate-review-details">
              <div><dt>Application</dt><dd>{issueTarget.application_number}</dd></div>
              <div><dt>Citizen</dt><dd>{issueTarget.citizen_name}</dd></div>
              <div><dt>Service</dt><dd>{issueTarget.service_name}</dd></div>
              <div><dt>Current status</dt><dd>{issueTarget.status}</dd></div>
              {Object.entries(issueTarget.application_data || {}).map(([field, value]) => (
                <div key={field}><dt>{field.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2")}</dt><dd>{String(value || "Not provided")}</dd></div>
              ))}
            </dl>
            <form onSubmit={issueCertificate}>
              <label className="certificate-note-label" htmlFor="certificate-verification-note">Verification note</label>
              <textarea
                id="certificate-verification-note"
                value={verificationNote}
                onChange={(event) => setVerificationNote(event.target.value)}
                minLength={10}
                maxLength={500}
                required
                placeholder="Record what you checked against the application."
              />
              <label className="certificate-confirm-check">
                <input type="checkbox" checked={verificationConfirmed} onChange={(event) => setVerificationConfirmed(event.target.checked)} />
                <span>I have reviewed the application details and confirm it is ready for certificate issuance.</span>
              </label>
              <p className="certificate-dialog-hint">A unique certificate number will be recorded. Reissue is disabled; verify the details before continuing.</p>
              <div className="certificate-dialog-actions">
                <button type="button" onClick={closeIssueDialog} disabled={issuing}>Cancel</button>
                <button type="submit" disabled={issuing || !verificationConfirmed || verificationNote.trim().length < 10}>
                  {issuing ? "Issuing..." : "Issue certificate"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {(details || detailsLoading) && (
        <div className="certificate-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetails(null); }}>
          <section className="certificate-dialog" role="dialog" aria-modal="true" aria-labelledby="certificate-details-title">
            <button className="certificate-dialog-close" type="button" aria-label="Close details" onClick={() => setDetails(null)}><X size={17} /></button>
            {detailsLoading ? <p>Loading certificate details...</p> : (
              <>
                <p className="certificate-admin-eyebrow">ISSUED DSMS RECORD</p>
                <h2 id="certificate-details-title">Certificate details</h2>
                <dl className="certificate-review-details">
                  <div><dt>Certificate number</dt><dd>{details.certificate_number}</dd></div>
                  <div><dt>Application</dt><dd>{details.application_number}</dd></div>
                  <div><dt>Citizen</dt><dd>{details.citizen_name}</dd></div>
                  <div><dt>Service</dt><dd>{details.service_name}</dd></div>
                  <div><dt>Issued on</dt><dd>{new Date(details.issued_at).toLocaleString("en-GB")}</dd></div>
                  <div><dt>Issued by</dt><dd>{details.issuer_name}</dd></div>
                  <div><dt>Verification note</dt><dd>{details.verification_note}</dd></div>
                </dl>
                <p className="certificate-dialog-hint">This record documents issuance through DSMS and does not claim external government endorsement.</p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Certificates;