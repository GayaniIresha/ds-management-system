import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CircleAlert, ShieldCheck } from "lucide-react";
import "./VerifyCertificate.css";

const API = "http://localhost:5000";

function VerifyCertificate() {
  const { certificateNumber } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function verifyCertificate() {
      try {
        const response = await fetch(
          `${API}/api/certificates/verify/${encodeURIComponent(certificateNumber)}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to verify this certificate.");
        setCertificate(data.certificate);
        setNotice(data.notice || "");
      } catch (verifyError) {
        if (verifyError.name !== "AbortError") {
          setError(verifyError.message || "Unable to verify this certificate.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    verifyCertificate();
    return () => controller.abort();
  }, [certificateNumber]);

  return (
    <main className="verify-certificate-page">
      <header className="verify-certificate-header">
        <div className="verify-brand"><ShieldCheck size={22} /><span>DSMS Record Verification</span></div>
        <Link to="/login"><ArrowLeft size={16} /> Citizen portal</Link>
      </header>
      <section className="verify-certificate-content">
        <p className="verify-eyebrow">PUBLIC RECORD CHECK</p>
        <h1>Certificate verification</h1>
        <p className="verify-intro">Check whether a certificate number exists in the DSMS issuance records.</p>

        {loading ? (
          <div className="verify-result" role="status">Checking certificate record...</div>
        ) : certificate ? (
          <div className="verify-result verify-result-valid" role="status">
            <div className="verify-result-title"><BadgeCheck size={21} /><h2>DSMS record found</h2></div>
            <dl>
              <div><dt>Certificate number</dt><dd>{certificate.certificate_number}</dd></div>
              <div><dt>Service</dt><dd>{certificate.service_name}</dd></div>
              <div><dt>Issue date</dt><dd><CalendarDays size={15} />{new Date(certificate.issued_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
            </dl>
            <p className="verify-privacy-note">No citizen identity or application details are displayed on this public page.</p>
            <p className="verify-scope-note">{notice}</p>
          </div>
        ) : (
          <div className="verify-result verify-result-invalid" role="alert">
            <div className="verify-result-title"><CircleAlert size={21} /><h2>Record not verified</h2></div>
            <p>{error}</p>
          </div>
        )}
        <p className="verify-footer">Verification confirms the DSMS database record only. It does not confirm external government endorsement.</p>
      </section>
    </main>
  );
}

export default VerifyCertificate;