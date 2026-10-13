const crypto = require("crypto");
const express = require("express");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

function formatDate(value) {
    return value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
        : "Not recorded";
}

function sendCertificatePdf(res, certificate) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${certificate.certificate_number}.pdf"`
    );
    res.setHeader("Cache-Control", "private, no-store");

    const pdf = new PDFDocument({
        size: "A4",
        margin: 58,
        info: {
            Title: `DSMS certificate ${certificate.certificate_number}`,
            Author: "Divisional Secretariat Management System"
        }
    });

    pdf.on("error", (error) => {
        console.error("Issued certificate PDF error:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Unable to generate the certificate PDF." });
        } else {
            res.destroy(error);
        }
    });
    pdf.pipe(res);

    pdf.fillColor("#173b70")
        .fontSize(11)
        .text("DIVISIONAL SECRETARIAT MANAGEMENT SYSTEM", { align: "center" });
    pdf.moveDown(1.5);
    pdf.fillColor("#172b4d")
        .fontSize(25)
        .text("DSMS-Issued Certificate", { align: "center" });
    pdf.moveDown(0.6);
    pdf.fillColor("#21724b")
        .fontSize(10)
        .text("ISSUED THROUGH THE AUTHORIZED DSMS ADMIN WORKFLOW", {
            align: "center"
        });
    pdf.moveDown(0.5);
    pdf.fillColor("#64748b")
        .fontSize(9)
        .text("This document records a certificate issued in DSMS. It does not represent external government endorsement.", {
            align: "center",
            lineGap: 3
        });
    pdf.moveDown(2);

    const details = [
        ["Certificate number", certificate.certificate_number],
        ["Service", certificate.service_name],
        ["Certificate holder", certificate.citizen_name],
        ["Related application", certificate.application_number],
        ["Application status", certificate.application_status],
        ["Issue date", formatDate(certificate.issued_at)],
        ["Issued by", certificate.issuer_name]
    ];

    details.forEach(([label, value]) => {
        pdf.fillColor("#64748b").fontSize(10).text(label.toUpperCase());
        pdf.moveDown(0.25);
        pdf.fillColor("#172b4d").fontSize(13).text(String(value || "Not recorded"));
        pdf.moveDown(1.1);
    });

    pdf.moveDown(1);
    pdf.fillColor("#174ea6")
        .fontSize(9)
        .text(`Verify this DSMS record at /certificates/verify/${certificate.certificate_number}`);
    pdf.end();
}

const certificateSelect = `
    SELECT
        c.certificate_id,
        c.certificate_number,
        c.application_id,
        c.issued_at,
        c.verification_note,
        a.application_number,
        a.status AS application_status,
        a.submitted_at,
        u.full_name AS citizen_name,
        s.service_name,
        issuer.full_name AS issuer_name
    FROM issued_certificates c
    INNER JOIN applications a ON a.application_id = c.application_id
    INNER JOIN users u ON u.user_id = a.user_id
    INNER JOIN services s ON s.service_id = a.service_id
    INNER JOIN users issuer ON issuer.user_id = c.issued_by`;

router.get("/admin/certificates", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [applications] = await pool.execute(
            `SELECT
                a.application_id,
                a.application_number,
                a.status,
                a.submitted_at,
                a.application_data,
                u.full_name AS citizen_name,
                s.service_name,
                c.certificate_id,
                c.certificate_number,
                c.issued_at,
                issuer.full_name AS issuer_name
             FROM applications a
             INNER JOIN users u ON u.user_id = a.user_id
             INNER JOIN services s ON s.service_id = a.service_id
             LEFT JOIN issued_certificates c ON c.application_id = a.application_id
             LEFT JOIN users issuer ON issuer.user_id = c.issued_by
             WHERE LOWER(a.status) = 'approved'
             ORDER BY a.submitted_at DESC`
        );

        const result = applications.map((application) => {
            let applicationData = application.application_data || {};

            if (typeof applicationData === "string") {
                try {
                    applicationData = JSON.parse(applicationData);
                } catch {
                    applicationData = {};
                }
            }

            return {
                ...application,
                application_data: applicationData
            };
        });

        return res.json({ applications: result });
    } catch (error) {
        console.error("Admin certificate list error:", error.message);
        return res.status(500).json({ message: "Unable to load certificate records." });
    }
});

router.post(
    "/admin/applications/:id/certificate",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        const applicationId = Number(req.params.id);
        const verificationNote = String(req.body.verification_note || "").trim();
        const verificationConfirmed = req.body.verification_confirmed === true;

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return res.status(400).json({ message: "Invalid application ID." });
        }

        if (!verificationConfirmed) {
            return res.status(400).json({
                message: "Confirm that you reviewed the application before issuing."
            });
        }

        if (verificationNote.length < 10 || verificationNote.length > 500) {
            return res.status(400).json({
                message: "Record a verification note between 10 and 500 characters before issuing."
            });
        }

        let connection;
        let transactionStarted = false;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            transactionStarted = true;

            const [applications] = await connection.execute(
                `SELECT application_id, status
                 FROM applications
                 WHERE application_id = ?
                 FOR UPDATE`,
                [applicationId]
            );

            if (applications.length === 0) {
                await connection.rollback();
                transactionStarted = false;
                return res.status(404).json({ message: "Application not found." });
            }

            if (String(applications[0].status).toLowerCase() !== "approved") {
                await connection.rollback();
                transactionStarted = false;
                return res.status(409).json({
                    message: "Certificates can be issued only for Approved applications."
                });
            }

            const [existing] = await connection.execute(
                `SELECT certificate_id, certificate_number
                 FROM issued_certificates
                 WHERE application_id = ?
                 LIMIT 1`,
                [applicationId]
            );

            if (existing.length > 0) {
                await connection.rollback();
                transactionStarted = false;
                return res.status(409).json({
                    message: "A certificate has already been issued for this application.",
                    certificate: existing[0]
                });
            }

            const certificateNumber = `DSMS-CERT-${new Date().getFullYear()}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
            const [result] = await connection.execute(
                `INSERT INTO issued_certificates
                    (application_id, certificate_number, issued_by, verification_note)
                 VALUES (?, ?, ?, ?)`,
                [applicationId, certificateNumber, req.user.user_id, verificationNote]
            );

            await connection.execute(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
                 VALUES (?, ?, ?, ?)`,
                [req.user.user_id, "certificate_issued", "certificate", result.insertId]
            );

            await connection.commit();
            transactionStarted = false;

            return res.status(201).json({
                message: "Certificate issued through the DSMS administrator workflow.",
                certificate: {
                    certificate_id: result.insertId,
                    certificate_number: certificateNumber
                }
            });
        } catch (error) {
            if (transactionStarted && connection) {
                await connection.rollback();
            }

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "A certificate already exists for this application."
                });
            }

            console.error("Certificate issuance error:", error.message);
            return res.status(500).json({ message: "Unable to issue the certificate." });
        } finally {
            if (connection) connection.release();
        }
    }
);

router.get("/admin/certificates/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const certificateId = Number(req.params.id);
        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({ message: "Invalid certificate ID." });
        }

        const [certificates] = await pool.execute(
            `${certificateSelect} WHERE c.certificate_id = ? LIMIT 1`,
            [certificateId]
        );

        if (certificates.length === 0) {
            return res.status(404).json({ message: "Certificate not found." });
        }

        return res.json({ certificate: certificates[0] });
    } catch (error) {
        console.error("Admin certificate details error:", error.message);
        return res.status(500).json({ message: "Unable to load certificate details." });
    }
});

router.get("/admin/certificates/:id/pdf", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const certificateId = Number(req.params.id);
        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({ message: "Invalid certificate ID." });
        }

        const [certificates] = await pool.execute(
            `${certificateSelect} WHERE c.certificate_id = ? LIMIT 1`,
            [certificateId]
        );

        if (certificates.length === 0) {
            return res.status(404).json({ message: "Certificate not found." });
        }

        return sendCertificatePdf(res, certificates[0]);
    } catch (error) {
        console.error("Admin certificate PDF error:", error.message);
        return res.status(500).json({ message: "Unable to download the certificate." });
    }
});

router.get("/citizen/certificates", authMiddleware, async (req, res) => {
    if (String(req.user.role).toLowerCase() !== "citizen") {
        return res.status(403).json({ message: "Citizen access is required." });
    }

    try {
        const [applications] = await pool.execute(
            `SELECT
                a.application_id,
                a.application_number,
                a.status AS application_status,
                a.submitted_at,
                s.service_name,
                c.certificate_id,
                c.certificate_number,
                c.issued_at
             FROM applications a
             INNER JOIN services s ON s.service_id = a.service_id
             LEFT JOIN issued_certificates c ON c.application_id = a.application_id
             WHERE a.user_id = ?
               AND LOWER(a.status) = 'approved'
             ORDER BY a.submitted_at DESC`,
            [req.user.user_id]
        );

        return res.json({ applications });
    } catch (error) {
        console.error("Citizen certificate list error:", error.message);
        return res.status(500).json({ message: "Unable to load your certificate records." });
    }
});

router.get("/citizen/certificates/:id/pdf", authMiddleware, async (req, res) => {
    if (String(req.user.role).toLowerCase() !== "citizen") {
        return res.status(403).json({ message: "Citizen access is required." });
    }

    try {
        const certificateId = Number(req.params.id);
        if (!Number.isInteger(certificateId) || certificateId <= 0) {
            return res.status(400).json({ message: "Invalid certificate ID." });
        }

        const [certificates] = await pool.execute(
            `${certificateSelect}
             INNER JOIN applications owner_app ON owner_app.application_id = c.application_id
             WHERE c.certificate_id = ? AND owner_app.user_id = ? LIMIT 1`,
            [certificateId, req.user.user_id]
        );

        if (certificates.length === 0) {
            return res.status(404).json({ message: "Certificate not found." });
        }

        return sendCertificatePdf(res, certificates[0]);
    } catch (error) {
        console.error("Citizen certificate PDF error:", error.message);
        return res.status(500).json({ message: "Unable to download this certificate." });
    }
});

router.get("/certificates/verify/:certificateNumber", async (req, res) => {
    const certificateNumber = String(req.params.certificateNumber || "").toUpperCase();

    if (!/^DSMS-CERT-\d{4}-[A-F0-9]{16}$/.test(certificateNumber)) {
        return res.status(400).json({ message: "Invalid certificate number format." });
    }

    try {
        const [certificates] = await pool.execute(
            `SELECT c.certificate_number, c.issued_at, s.service_name
             FROM issued_certificates c
             INNER JOIN applications a ON a.application_id = c.application_id
             INNER JOIN services s ON s.service_id = a.service_id
             WHERE c.certificate_number = ?
               AND LOWER(a.status) = 'approved'
             LIMIT 1`,
            [certificateNumber]
        );

        if (certificates.length === 0) {
            return res.status(404).json({
                valid: false,
                message: "No active DSMS certificate record matches this number."
            });
        }

        return res.json({
            valid: true,
            certificate: {
                certificate_number: certificates[0].certificate_number,
                service_name: certificates[0].service_name,
                issued_at: certificates[0].issued_at
            },
            notice: "This verifies a certificate record in DSMS only. It does not verify external government authorization."
        });
    } catch (error) {
        console.error("Public certificate verification error:", error.message);
        return res.status(500).json({ message: "Unable to verify the certificate." });
    }
});

module.exports = router;