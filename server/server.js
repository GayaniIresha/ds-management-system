
const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const certificateRoutes = require("./routes/certificates");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", certificateRoutes);

async function createNotification({
    userId,
    applicationId,
    title,
    message,
    type,
    eventKey
}) {
    await pool.execute(
        `INSERT IGNORE INTO notifications
            (user_id, application_id, title, message, notification_type, event_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, applicationId || null, title, message, type, eventKey]
    );
}

async function notifyRole({
    role,
    applicationId,
    title,
    message,
    type,
    eventKey
}) {
    const [users] = await pool.execute(
        `SELECT u.user_id
         FROM users u
         INNER JOIN roles r ON u.role_id = r.role_id
         WHERE LOWER(r.role_name) = ? AND u.is_active = 1`,
        [role.toLowerCase()]
    );

    for (const user of users) {
        await createNotification({
            userId: user.user_id,
            applicationId,
            title,
            message,
            type,
            eventKey
        });
    }
}

// =====================================================
// NOTIFICATIONS API
// =====================================================

// Get notifications for the logged-in user
app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [notifications] = await pool.execute(
            `SELECT notification_id, application_id, title,
                    message, notification_type, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId]
        );

        const [unreadResult] = await pool.execute(
            `SELECT COUNT(*) AS unread_count
             FROM notifications
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );

        return res.json({
            notifications,
            unread_count: Number(unreadResult[0].unread_count)
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);
        return res.status(500).json({
            message: "Unable to load notifications."
        });
    }
});

app.get(
    "/api/notifications/unread-count",
    authMiddleware,
    async (req, res) => {
        try {
            const [rows] = await pool.execute(
                `SELECT COUNT(*) AS unread_count
                 FROM notifications
                 WHERE user_id = ? AND is_read = 0`,
                [req.user.user_id]
            );

            return res.json({
                unread_count: Number(rows[0].unread_count)
            });
        } catch (error) {
            console.error("Get unread notification count error:", error.message);
            return res.status(500).json({
                message: "Unable to load unread notification count."
            });
        }
    }
);

// Mark one notification as read
app.patch(
    "/api/notifications/:id/read",
    authMiddleware,
    async (req, res) => {
        try {
            const userId = req.user.user_id;
            const notificationId = Number(req.params.id);

            if (!Number.isInteger(notificationId) || notificationId < 1) {
                return res.status(400).json({
                    message: "Invalid notification ID."
                });
            }

            const [result] = await pool.execute(
                `UPDATE notifications
                 SET is_read = 1
                 WHERE notification_id = ? AND user_id = ?`,
                [notificationId, userId]
            );

            if (result.affectedRows === 0) {
                const [rows] = await pool.execute(
                    `SELECT notification_id
                     FROM notifications
                     WHERE notification_id = ? AND user_id = ?
                     LIMIT 1`,
                    [notificationId, userId]
                );

                if (!rows.length) {
                    return res.status(404).json({
                        message: "Notification not found."
                    });
                }
            }

            return res.json({
                message: "Notification marked as read."
            });
        } catch (error) {
            console.error("Mark notification read error:", error.message);
            return res.status(500).json({
                message: "Unable to update notification."
            });
        }
    }
);

app.patch(
    "/api/notifications/read-all",
    authMiddleware,
    async (req, res) => {
        try {
            await pool.execute(
                `UPDATE notifications
                 SET is_read = 1
                 WHERE user_id = ? AND is_read = 0`,
                [req.user.user_id]
            );

            return res.json({ message: "All notifications marked as read." });
        } catch (error) {
            console.error("Mark all notifications read error:", error.message);
            return res.status(500).json({
                message: "Unable to update notifications."
            });
        }
    }
);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
    res.json({ message: "DSMS API is running" });
});

// =====================================================
// DATABASE HEALTH CHECK
// =====================================================

app.get("/api/health/db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT DATABASE() AS databaseName");

        return res.json({
            message: "Database connection successful",
            database: rows[0].databaseName
        });
    } catch (error) {
        console.error("Database health error:", error.message);
        return res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// =====================================================
// AUTHENTICATED USER PROFILE
// =====================================================

app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT user_id, full_name, email, role_id
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [req.user.user_id]
        );

        if (!users.length) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "Authentication successful",
            user: users[0]
        });
    } catch (error) {
        console.error("User profile error:", error.message);
        return res.status(500).json({
            message: "Unable to retrieve user profile"
        });
    }
});

// =====================================================
// CITIZEN DASHBOARD
// =====================================================

app.get(
    "/api/citizen/dashboard",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "citizen") {
                return res.status(403).json({
                    message: "Citizen access is required."
                });
            }

            const userId = req.user.user_id;

            const [users] = await pool.execute(
                `SELECT full_name FROM users
                 WHERE user_id = ? LIMIT 1`,
                [userId]
            );

            if (!users.length) {
                return res.status(404).json({ message: "User not found" });
            }

            const [statsRows] = await pool.execute(
                `SELECT
                    COUNT(*) AS totalApplications,
                    SUM(CASE WHEN LOWER(status) IN
                        ('pending', 'under review')
                        THEN 1 ELSE 0 END) AS pendingApplications,
                    SUM(CASE WHEN LOWER(status) = 'approved'
                        THEN 1 ELSE 0 END) AS approvedApplications,
                    SUM(CASE WHEN LOWER(status) = 'rejected'
                        THEN 1 ELSE 0 END) AS rejectedApplications
                 FROM applications
                 WHERE user_id = ?`,
                [userId]
            );

            const [applications] = await pool.execute(
                `SELECT a.application_number, s.service_name,
                        a.submitted_at, a.status
                 FROM applications a
                 JOIN services s ON a.service_id = s.service_id
                 WHERE a.user_id = ?
                 ORDER BY a.submitted_at DESC
                 LIMIT 5`,
                [userId]
            );

            const stats = statsRows[0];

            return res.json({
                message: "Dashboard data retrieved successfully",
                user: users[0],
                stats: {
                    totalApplications: Number(stats.totalApplications || 0),
                    pendingApplications: Number(stats.pendingApplications || 0),
                    approvedApplications: Number(stats.approvedApplications || 0),
                    rejectedApplications: Number(stats.rejectedApplications || 0)
                },
                applications
            });
        } catch (error) {
            console.error("Dashboard API error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve dashboard data"
            });
        }
    }
);

// =====================================================
// CITIZEN: ACTIVE SERVICES
// =====================================================

app.get(
    "/api/citizen/services",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "citizen") {
                return res.status(403).json({
                    message: "Citizen access is required."
                });
            }

            const [services] = await pool.execute(
                `SELECT service_id, service_name, description
                 FROM services
                 WHERE is_active = 1
                 ORDER BY service_name`
            );

            return res.json({ services });
        } catch (error) {
            console.error("Services API error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve services"
            });
        }
    }
);

// =====================================================
// CITIZEN: SUBMIT APPLICATION
// =====================================================

app.post(
    "/api/citizen/applications",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "citizen") {
                return res.status(403).json({
                    message: "Citizen access is required."
                });
            }

            const {
                service_id,
                fullName,
                nic,
                phone,
                address,
                description
            } = req.body;

            if (
                !service_id ||
                !fullName?.trim() ||
                !nic?.trim() ||
                !phone?.trim() ||
                !address?.trim()
            ) {
                return res.status(400).json({
                    message: "Please complete all required fields."
                });
            }

            const [services] = await pool.execute(
                `SELECT service_id FROM services
                 WHERE service_id = ? AND is_active = 1
                 LIMIT 1`,
                [service_id]
            );

            if (!services.length) {
                return res.status(400).json({
                    message: "Please select a valid service."
                });
            }

            const applicationNumber =
                `DSMS-${Date.now()}-${crypto.randomBytes(3)
                    .toString("hex").toUpperCase()}`;

            const applicationData = JSON.stringify({
                fullName: fullName.trim(),
                nic: nic.trim(),
                phone: phone.trim(),
                address: address.trim(),
                description: (description || "").trim()
            });

            const [result] = await pool.execute(
                `INSERT INTO applications
                    (application_number, user_id, service_id,
                     status, application_data)
                 VALUES (?, ?, ?, 'Pending', ?)`,
                [
                    applicationNumber,
                    req.user.user_id,
                    service_id,
                    applicationData
                ]
            );

            await createNotification({
                userId: req.user.user_id,
                applicationId: result.insertId,
                title: "Application Submitted",
                message: `Your application ${applicationNumber} has been submitted successfully. Current status: Pending.`,
                type: "application_submitted",
                eventKey: `application-submitted:${result.insertId}`
            });

            await notifyRole({
                role: "admin",
                applicationId: result.insertId,
                title: "New Application Submitted",
                message: `Application ${applicationNumber} is awaiting officer assignment.`,
                type: "application_submitted",
                eventKey: `application-submitted:${result.insertId}`
            });

            return res.status(201).json({
                message: "Application submitted successfully!",
                application: {
                    application_id: result.insertId,
                    application_number: applicationNumber,
                    status: "Pending"
                }
            });
        } catch (error) {
            console.error("Application submission error:", error.message);
            return res.status(500).json({
                message: "Unable to submit application."
            });
        }
    }
);

// =====================================================
// CITIZEN: VIEW OWN APPLICATIONS
// =====================================================

app.get(
    "/api/citizen/applications",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "citizen") {
                return res.status(403).json({
                    message: "Citizen access is required."
                });
            }

            const [applications] = await pool.execute(
                `SELECT a.application_id, a.application_number,
                        a.status, a.submitted_at, s.service_name
                 FROM applications a
                 INNER JOIN services s ON a.service_id = s.service_id
                 WHERE a.user_id = ?
                 ORDER BY a.submitted_at DESC`,
                [req.user.user_id]
            );

            return res.json({ applications });
        } catch (error) {
            console.error("My Applications API error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve applications."
            });
        }
    }
);

// =====================================================
// CITIZEN: VIEW ONE OWN APPLICATION
// =====================================================

app.get(
    "/api/citizen/applications/:id",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "citizen") {
                return res.status(403).json({
                    message: "Citizen access is required."
                });
            }

            const applicationId = Number(req.params.id);

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            const [rows] = await pool.execute(
                `SELECT a.application_id, a.application_number,
                        a.status, a.submitted_at, a.application_data,
                        s.service_name
                 FROM applications a
                 INNER JOIN services s ON a.service_id = s.service_id
                 WHERE a.application_id = ? AND a.user_id = ?
                 LIMIT 1`,
                [applicationId, req.user.user_id]
            );

            if (!rows.length) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }

            const application = rows[0];

            try {
                application.application_data =
                    typeof application.application_data === "string"
                        ? JSON.parse(application.application_data || "{}")
                        : application.application_data || {};
            } catch {
                application.application_data = {};
            }

            return res.json({ application });
        } catch (error) {
            console.error("Application details error:", error.message);
            return res.status(500).json({
                message: "Unable to load application details."
            });
        }
    }
);

// =====================================================
// CITIZEN: DOWNLOAD APPLICATION RECORD PDF
// =====================================================

app.get(
    "/api/citizen/applications/:id/certificate.pdf",
    authMiddleware,
    async (req, res) => {
        if (String(req.user.role).toLowerCase() !== "citizen") {
            return res.status(403).json({
                message: "Citizen access is required."
            });
        }

        const applicationId = Number(req.params.id);

        if (!Number.isInteger(applicationId) || applicationId <= 0) {
            return res.status(400).json({
                message: "Invalid application ID."
            });
        }

        try {
            const [rows] = await pool.execute(
                `SELECT a.application_number, a.status, a.submitted_at,
                        u.full_name, s.service_name
                 FROM applications a
                 INNER JOIN users u ON a.user_id = u.user_id
                 INNER JOIN services s ON a.service_id = s.service_id
                 WHERE a.application_id = ? AND a.user_id = ?
                 LIMIT 1`,
                [applicationId, req.user.user_id]
            );

            if (!rows.length) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }

            const application = rows[0];

            if (String(application.status).toLowerCase() !== "approved") {
                return res.status(409).json({
                    message: "A document is available only for Approved applications."
                });
            }

            const safeNumber = String(application.application_number)
                .replace(/[^a-zA-Z0-9_-]/g, "_");

            const submittedDate = application.submitted_at
                ? new Date(application.submitted_at).toLocaleDateString("en-GB")
                : "Not recorded";

            const generatedDate = new Date().toLocaleDateString("en-GB");

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="DSMS-${safeNumber}.pdf"`
            );
            res.setHeader("Cache-Control", "private, no-store");

            const pdf = new PDFDocument({
                size: "A4",
                margin: 58,
                info: {
                    Title: `DSMS application record ${application.application_number}`,
                    Author: "Divisional Secretariat Management System"
                }
            });

            pdf.on("error", (error) => {
                console.error("PDF generation error:", error.message);

                if (!res.headersSent) {
                    res.status(500).json({
                        message: "Unable to generate this document."
                    });
                } else {
                    res.destroy(error);
                }
            });

            pdf.pipe(res);

            pdf.fillColor("#173b70")
                .fontSize(11)
                .text("DIVISIONAL SECRETARIAT MANAGEMENT SYSTEM", {
                    align: "center"
                });

            pdf.moveDown(1.5);

            pdf.fillColor("#172b4d")
                .fontSize(24)
                .text("Application Record", { align: "center" });

            pdf.moveDown(0.5);

            pdf.fillColor("#b91c1c")
                .fontSize(10)
                .text(
                    "SYSTEM-GENERATED DOCUMENT - NOT AN OFFICIAL GOVERNMENT CERTIFICATE",
                    { align: "center" }
                );

            pdf.moveDown(2);

            const details = [
                ["Service / certificate", application.service_name],
                ["Application number", application.application_number],
                ["Citizen name", application.full_name],
                ["Application date", submittedDate],
                ["Recorded application status", "Approved"],
                ["Official issue date", "Not recorded by this system"],
                ["Document generated", generatedDate]
            ];

            details.forEach(([label, value]) => {
                pdf.fillColor("#64748b").fontSize(10).text(label.toUpperCase());
                pdf.moveDown(0.25);
                pdf.fillColor("#172b4d").fontSize(13).text(String(value || "Not recorded"));
                pdf.moveDown(1.2);
            });

            pdf.moveDown(1);

            pdf.fillColor("#64748b")
                .fontSize(9)
                .text(
                    "This record reflects the application status stored in DSMS at the time of generation. It is not proof of an officially issued government certificate.",
                    { align: "left", lineGap: 3 }
                );

            pdf.end();
        } catch (error) {
            console.error("Certificate download error:", error.message);

            if (!res.headersSent) {
                return res.status(500).json({
                    message: "Unable to retrieve the application document."
                });
            }
        }
    }
);

// =====================================================
// OFFICER: VIEW ALL APPLICATIONS
// =====================================================

app.get(
    "/api/officer/applications",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "officer") {
                return res.status(403).json({
                    message: "Officer access is required."
                });
            }

            const [applications] = await pool.execute(
                `SELECT a.application_id, a.application_number,
                        a.status, a.submitted_at, a.application_data,
                        a.officer_recommendation, a.officer_review_note,
                       a.officer_reviewed_at, a.assigned_officer_id,
                       u.full_name AS citizen_name,
                       s.service_name
                FROM applications a
                INNER JOIN users u ON a.user_id = u.user_id
                INNER JOIN services s ON a.service_id = s.service_id
                WHERE a.assigned_officer_id IS NULL
                   OR a.assigned_officer_id = ?
                ORDER BY a.submitted_at DESC`
                , [req.user.user_id]
            );

            const result = applications.map((application) => {
                let details = application.application_data || {};

                if (typeof details === "string") {
                    try {
                        details = JSON.parse(details);
                    } catch {
                        details = {};
                    }
                }

                return { ...application, application_data: details };
            });

            return res.json({ applications: result });
        } catch (error) {
            console.error("Officer applications error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve applications."
            });
        }
    }
);

// =====================================================
// OFFICER: VIEW ONE APPLICATION
// =====================================================

app.get(
    "/api/officer/applications/:id",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "officer") {
                return res.status(403).json({
                    message: "Officer access is required."
                });
            }

            const applicationId = Number(req.params.id);

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            const [rows] = await pool.execute(
                `SELECT a.application_id, a.application_number,
                        a.status, a.submitted_at, a.application_data,
                        a.officer_recommendation, a.officer_review_note,
                       a.officer_reviewed_at, a.assigned_officer_id,
                       u.full_name AS citizen_name,
                       u.email AS citizen_email, s.service_name
                 FROM applications a
                 INNER JOIN users u ON a.user_id = u.user_id
                 INNER JOIN services s ON a.service_id = s.service_id
                 WHERE a.application_id = ?
                   AND (a.assigned_officer_id IS NULL
                        OR a.assigned_officer_id = ?)
                 LIMIT 1`,
                [applicationId, req.user.user_id]
            );

            if (!rows.length) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }

            const application = rows[0];

            try {
                application.application_data =
                    typeof application.application_data === "string"
                        ? JSON.parse(application.application_data || "{}")
                        : application.application_data || {};
            } catch {
                application.application_data = {};
            }

            return res.json({ application });
        } catch (error) {
            console.error("Officer application details error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve application details."
            });
        }
    }
);

// =====================================================
// OFFICER: SUBMIT RECOMMENDATION
// =====================================================

app.patch(
    "/api/officer/applications/:id/status",
    authMiddleware,
    async (req, res) => {
        try {
            if (String(req.user.role).toLowerCase() !== "officer") {
                return res.status(403).json({
                    message: "Officer access is required."
                });
            }

            const applicationId = Number(req.params.id);
            const { status, officer_recommendation, review_note } = req.body;

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            const [existing] = await pool.execute(
                `SELECT application_id, user_id, application_number, status,
                        officer_recommendation, assigned_officer_id
                 FROM applications
                 WHERE application_id = ?
                 LIMIT 1`,
                [applicationId]
            );

            if (!existing.length) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }

            const application = existing[0];

            if (
                application.assigned_officer_id &&
                Number(application.assigned_officer_id) !== Number(req.user.user_id)
            ) {
                return res.status(403).json({
                    message: "This application is assigned to another officer."
                });
            }

            if (["Approved", "Rejected"].includes(application.status)) {
                return res.status(409).json({
                    message: "This application has already been finalized.",
                    current_status: application.status
                });
            }

            // Mark as Under Review without recommendation
            if (
                status === "Under Review" &&
                officer_recommendation === undefined
            ) {
                if (application.status !== "Under Review") {
                    await pool.execute(
                        `UPDATE applications
                         SET status = 'Under Review'
                         WHERE application_id = ?`,
                        [applicationId]
                    );

                    await createNotification({
                        userId: application.user_id,
                        applicationId,
                        title: "Application Under Review",
                        message: `Your application ${application.application_number} is now under review.`,
                        type: "application_review_started",
                        eventKey: `application-review-started:${applicationId}`
                    });
                }

                return res.json({
                    message: "Application marked Under Review.",
                    application_id: applicationId,
                    status: "Under Review"
                });
            }

            const allowedRecommendations = [
                "Recommended for Approval",
                "Recommended for Rejection",
                "Recommended",
                "Not Recommended"
            ];

            if (!allowedRecommendations.includes(officer_recommendation)) {
                return res.status(400).json({
                    message: "Select a valid officer recommendation."
                });
            }

            if (typeof review_note !== "string" || !review_note.trim()) {
                return res.status(400).json({
                    message: "Please enter a review note."
                });
            }

            const normalizedRecommendation =
                officer_recommendation === "Recommended"
                    ? "Recommended for Approval"
                    : officer_recommendation === "Not Recommended"
                        ? "Recommended for Rejection"
                        : officer_recommendation;
            const recommendationChanged =
                application.officer_recommendation !== normalizedRecommendation;

            await pool.execute(
                `UPDATE applications
                 SET status = 'Under Review',
                     officer_recommendation = ?,
                     officer_review_note = ?,
                     officer_reviewed_at = NOW()
                 WHERE application_id = ?`,
                [normalizedRecommendation, review_note.trim(), applicationId]
            );

            if (application.status !== "Under Review") {
                await createNotification({
                    userId: application.user_id,
                    applicationId,
                    title: "Application Under Review",
                    message: `Your application ${application.application_number} is now under review.`,
                    type: "application_review_started",
                    eventKey: `application-review-started:${applicationId}`
                });
            }

            if (recommendationChanged) {
                const previousRecommendation =
                    application.officer_recommendation || "none";
                const recommendationEvent =
                    `application-recommendation:${applicationId}:` +
                    `${previousRecommendation}:${normalizedRecommendation}`;

                await createNotification({
                    userId: application.user_id,
                    applicationId,
                    title: "Officer Recommendation Submitted",
                    message: `An officer submitted a recommendation for application ${application.application_number}. The application is awaiting an administrator's decision.`,
                    type: "application_recommendation",
                    eventKey: recommendationEvent
                });

                await notifyRole({
                    role: "admin",
                    applicationId,
                    title: "Officer Recommendation Submitted",
                    message: `Application ${application.application_number} has an officer recommendation and is ready for a final decision.`,
                    type: "application_recommendation",
                    eventKey: recommendationEvent
                });
            }

            return res.json({
                message: "Recommendation submitted to Admin.",
                application_id: applicationId,
                status: "Under Review",
                officer_recommendation: normalizedRecommendation
            });
        } catch (error) {
            console.error("Officer recommendation error:", error.message);
            return res.status(500).json({
                message: "Unable to submit recommendation."
            });
        }
    }
);

// =====================================================
// ADMIN: VIEW ALL APPLICATIONS
// =====================================================

app.get(
    "/api/admin/applications",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const [applications] = await pool.execute(
                `SELECT a.application_id, a.application_number,
                        a.status, a.submitted_at, a.application_data,
                        a.officer_recommendation, a.officer_review_note,
                        a.officer_reviewed_at, u.full_name AS citizen_name,
                        u.email AS citizen_email, s.service_name,
                        a.assigned_officer_id,
                        officer.full_name AS assigned_officer_name
                 FROM applications a
                 INNER JOIN users u ON a.user_id = u.user_id
                 INNER JOIN services s ON a.service_id = s.service_id
                 LEFT JOIN users officer
                    ON a.assigned_officer_id = officer.user_id
                 ORDER BY a.submitted_at DESC`
            );

            const result = applications.map((application) => {
                let details = application.application_data || {};

                if (typeof details === "string") {
                    try {
                        details = JSON.parse(details);
                    } catch {
                        details = {};
                    }
                }

                return { ...application, application_data: details };
            });

            return res.json({ applications: result });
        } catch (error) {
            console.error("Admin applications error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve applications."
            });
        }
    }
);

app.get(
    "/api/admin/officers",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const [officers] = await pool.execute(
                `SELECT u.user_id, u.full_name, u.email
                 FROM users u
                 INNER JOIN roles r ON u.role_id = r.role_id
                 WHERE LOWER(r.role_name) = 'officer'
                   AND u.is_active = 1
                 ORDER BY u.full_name`
            );

            return res.json({ officers });
        } catch (error) {
            console.error("Admin officers error:", error.message);
            return res.status(500).json({
                message: "Unable to retrieve officers."
            });
        }
    }
);

app.patch(
    "/api/admin/applications/:id/assign",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const applicationId = Number(req.params.id);
            const officerId = Number(req.body.officer_id);

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }
            if (!Number.isInteger(officerId) || officerId <= 0) {
                return res.status(400).json({
                    message: "Select a valid officer."
                });
            }

            const [applications] = await pool.execute(
                `SELECT application_id, user_id, application_number,
                        assigned_officer_id
                 FROM applications
                 WHERE application_id = ?
                 LIMIT 1`,
                [applicationId]
            );
            if (!applications.length) {
                return res.status(404).json({
                    message: "Application not found."
                });
            }

            const [officers] = await pool.execute(
                `SELECT u.user_id, u.full_name
                 FROM users u
                 INNER JOIN roles r ON u.role_id = r.role_id
                 WHERE u.user_id = ?
                   AND LOWER(r.role_name) = 'officer'
                   AND u.is_active = 1
                 LIMIT 1`,
                [officerId]
            );
            if (!officers.length) {
                return res.status(400).json({
                    message: "Select an active officer account."
                });
            }

            const application = applications[0];
            if (Number(application.assigned_officer_id) === officerId) {
                return res.json({
                    message: "Application is already assigned to this officer."
                });
            }

            await pool.execute(
                `UPDATE applications
                 SET assigned_officer_id = ?
                 WHERE application_id = ?`,
                [officerId, applicationId]
            );

            const assignmentEvent =
                `application-assigned:${applicationId}:` +
                `${application.assigned_officer_id || "unassigned"}:${officerId}`;

            await createNotification({
                userId: officerId,
                applicationId,
                title: "Application Assigned to You",
                message: `Application ${application.application_number} has been assigned to you.`,
                type: "application_assigned",
                eventKey: assignmentEvent
            });
            await createNotification({
                userId: application.user_id,
                applicationId,
                title: "Application Assigned",
                message: `An officer has been assigned to your application ${application.application_number}.`,
                type: "application_assigned",
                eventKey: assignmentEvent
            });

            return res.json({
                message: `Application assigned to ${officers[0].full_name}.`,
                application_id: applicationId,
                assigned_officer_id: officerId,
                assigned_officer_name: officers[0].full_name
            });
        } catch (error) {
            console.error("Application assignment error:", error.message);
            return res.status(500).json({
                message: "Unable to assign the application."
            });
        }
    }
);

// =====================================================
// ADMIN: FINAL APPROVAL OR REJECTION
// =====================================================

app.patch(
    "/api/admin/applications/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const applicationId = Number(req.params.id);
            const { status } = req.body;

            if (!Number.isInteger(applicationId) || applicationId <= 0) {
                return res.status(400).json({
                    message: "Invalid application ID."
                });
            }

            if (!["Approved", "Rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be Approved or Rejected."
                });
            }

            const [result] = await pool.execute(
                `UPDATE applications
                 SET status = ?
                 WHERE application_id = ?
                   AND status = 'Under Review'
                   AND officer_recommendation IS NOT NULL`,
                [status, applicationId]
            );

            if (result.affectedRows === 0) {
                const [existing] = await pool.execute(
                    `SELECT application_id, status, officer_recommendation
                     FROM applications
                     WHERE application_id = ?
                     LIMIT 1`,
                    [applicationId]
                );

                if (!existing.length) {
                    return res.status(404).json({
                        message: "Application not found."
                    });
                }

                return res.status(409).json({
                    message:
                        "An officer recommendation is required before the final decision.",
                    current_status: existing[0].status,
                    officer_recommendation: existing[0].officer_recommendation
                });
            }

            const [applicationRows] = await pool.execute(
                `SELECT user_id, application_number
                 FROM applications
                 WHERE application_id = ?
                 LIMIT 1`,
                [applicationId]
            );

            if (applicationRows.length) {
                const application = applicationRows[0];

                await createNotification({
                    userId: application.user_id,
                    applicationId,
                    title: `Application ${status}`,
                    message: `Your application ${application.application_number} has been ${status.toLowerCase()}.`,
                    type: `application_${status.toLowerCase()}`,
                    eventKey: `application-final-status:${applicationId}:${status}`
                });
            }

            return res.json({
                message: `Application ${status.toLowerCase()} successfully.`,
                application_id: applicationId,
                status
            });
        } catch (error) {
            console.error("Admin final decision error:", error.message);
            return res.status(500).json({
                message: "Unable to make the final decision."
            });
        }
    }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
