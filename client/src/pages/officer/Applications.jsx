
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import "./OfficerApplication.css";

const API_URL = "http://localhost:5000/api";

const FILTERS = [
  "All",
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Reviewed",
];

function getToken() {
  return localStorage.getItem("dsmsToken");
}

function getHeaders(json = false) {
  const token = getToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function getErrorMessage(data, fallback) {
  return data?.message || data?.error || fallback;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString();
}

function getStatus(application) {
  return application?.status || "Pending";
}

function getRecommendation(application) {
  return application?.officer_recommendation || "";
}

function isReviewed(application) {
  return Boolean(
    application?.officer_recommendation ||
      application?.officer_reviewed_at
  );
}

function getApplicationDetails(application) {
  let details = application?.application_data;

  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      details = {};
    }
  }

  if (!details || typeof details !== "object" || Array.isArray(details)) {
    details = {};
  }

  // Explicit application fields take precedence over JSON fields.
  return {
    ...details,
    ...application,
  };
}

function getApplicantName(application) {
  const details = getApplicationDetails(application);

  return (
    details?.fullName ||
    details?.full_name ||
    details?.applicant_name ||
    details?.name ||
    details?.citizen_name ||
    details?.user_name ||
    "Not available"
  );
}

function getApplicationNumber(application) {
  return (
    application?.application_number ||
    application?.reference_number ||
    application?.application_no ||
    application?.id ||
    "—"
  );
}

function getStatusClass(status) {
  return String(status || "Pending")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function Applications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeFilter = searchParams.get("filter") || "All";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [recommendation, setRecommendation] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Load all applications
  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/officer/applications`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load applications.")
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.applications)
          ? data.applications
          : Array.isArray(data.data)
            ? data.data
            : [];

      setApplications(
        list.map((application) => ({
          ...application,
          id: application.application_id ?? application.id,
        }))
      );
    } catch (err) {
      setError(
        err.message ||
          "Cannot connect to the server. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadApplications(), 0);
    return () => window.clearTimeout(timer);
  }, [loadApplications]);

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const details = getApplicationDetails(application);
      const status = getStatus(application);
      const reviewed = isReviewed(application);

      let matchesFilter = true;

      if (activeFilter === "Reviewed") {
        matchesFilter = reviewed;
      } else if (activeFilter !== "All") {
        matchesFilter =
          status.toLowerCase() === activeFilter.toLowerCase();
      }

      const searchableText = [
        getApplicationNumber(application),
        getApplicantName(application),
        details.application_type,
        details.service_type,
        details.service_name,
        details.nic,
        details.email,
        details.phone,
        details.address,
        application?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [applications, activeFilter, search]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Dashboard counters
  const counts = useMemo(() => {
    return {
      All: applications.length,

      Pending: applications.filter(
        (item) => getStatus(item).toLowerCase() === "pending"
      ).length,

      "Under Review": applications.filter(
        (item) => getStatus(item).toLowerCase() === "under review"
      ).length,

      Approved: applications.filter(
        (item) => getStatus(item).toLowerCase() === "approved"
      ).length,

      Rejected: applications.filter(
        (item) => getStatus(item).toLowerCase() === "rejected"
      ).length,

      Reviewed: applications.filter(isReviewed).length,
    };
  }, [applications]);

  // Change filter
  function changeFilter(filter) {
    setPage(1);

    if (filter === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ filter });
    }

    setSelectedApplication(null);
    setSuccessMessage("");
  }

  // Open application details
  async function openApplication(application) {
    setSelectedApplication(application);
    setRecommendation(getRecommendation(application));
    setReviewNote(application?.officer_review_note || "");
    setSuccessMessage("");
    setError("");
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/officer/applications/${application.id}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const details =
          data?.application ||
          data?.data ||
          data;

        if (
          details &&
          typeof details === "object" &&
          !Array.isArray(details)
        ) {
          setSelectedApplication((previous) => ({
            ...previous,
            ...details,
            application_data:
              details.application_data ??
              previous?.application_data ??
              {},
            id: details.application_id ?? details.id ?? previous.id,
          }));

          setRecommendation(getRecommendation(details));
          setReviewNote(details?.officer_review_note || "");
        }
      }
    } catch {
      // Keep the application data from the list.
    } finally {
      setDetailsLoading(false);
    }
  }

  // Close application details
  function closeDetails() {
    setSelectedApplication(null);
    setRecommendation("");
    setReviewNote("");
    setSuccessMessage("");
  }

  async function startReview() {
    if (!selectedApplication?.id) {
      setError("Application ID is missing.");
      return;
    }

    setStartingReview(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/officer/applications/${selectedApplication.id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(true),
          body: JSON.stringify({ status: "Under Review" }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to start review."));
      }

      setSelectedApplication((previous) => ({
        ...previous,
        status: "Under Review",
      }));

      setSuccessMessage(data.message || "Review started.");
      await loadApplications();
    } catch (requestError) {
      setError(requestError.message || "Unable to start review.");
    } finally {
      setStartingReview(false);
    }
  }

  // Submit recommendation
  async function submitRecommendation(event) {
    event.preventDefault();

    if (!selectedApplication?.id) {
      setError("Application ID is missing.");
      return;
    }

    if (
      ![
        "Recommended for Approval",
        "Recommended for Rejection",
      ].includes(recommendation)
    ) {
      setError("Please select a recommendation.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/officer/applications/${selectedApplication.id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(true),
          body: JSON.stringify({
            officer_recommendation: recommendation,
            review_note: reviewNote.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to submit recommendation.")
        );
      }

      setSuccessMessage(
        data?.message || "Recommendation submitted successfully."
      );

      await loadApplications();

      // Refresh selected application details
      try {
        const detailsResponse = await fetch(
          `${API_URL}/officer/applications/${selectedApplication.id}`,
          {
            headers: getHeaders(),
          }
        );

        const detailsData = await detailsResponse
          .json()
          .catch(() => ({}));

        if (detailsResponse.ok) {
          const details =
            detailsData?.application ||
            detailsData?.data ||
            detailsData;

          if (
            details &&
            typeof details === "object" &&
            !Array.isArray(details)
          ) {
            setSelectedApplication((previous) => ({
              ...previous,
              ...details,
              application_data:
                details.application_data ??
                previous?.application_data ??
                {},
              id: details.application_id ?? details.id ?? previous.id,
            }));

            setRecommendation(getRecommendation(details));
            setReviewNote(details?.officer_review_note || "");
          }
        }
      } catch {
        // Keep the current details visible.
      }
    } catch (err) {
      setError(
        err.message ||
          "An error occurred while submitting the recommendation."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function goToPage(nextPage) {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  }

  function updateSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  return (
    <div className="officer-applications">
      {/* Header */}
      <div className="applications-header">
        <div>
          <h1>Applications</h1>
          <p>
            View applications and submit officer recommendations.
          </p>
        </div>

        <div className="applications-header-actions">
          <NotificationBell />

          <button
            type="button"
            className="applications-back-btn"
            onClick={() => navigate("/officer/dashboard")}
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            className="applications-refresh-btn"
            onClick={loadApplications}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="applications-alert applications-alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics cards */}
      <div className="applications-stat-grid">
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter}
            className={`applications-stat-card ${
              activeFilter === filter ? "active" : ""
            }`}
            onClick={() => changeFilter(filter)}
          >
            <span className="applications-stat-label">{filter}</span>
            <strong>{counts[filter]}</strong>
            <span className="applications-stat-hint">
              View applications
            </span>
          </button>
        ))}
      </div>

      {/* Applications panel */}
      <section className="applications-panel">
        <div className="applications-toolbar">
          <div>
            <h2>
              {activeFilter === "All"
                ? "All Applications"
                : `${activeFilter} Applications`}
            </h2>

            <p>
              {filteredApplications.length} application(s) found
            </p>
          </div>

          <input
            type="search"
            className="applications-search"
            placeholder="Search by name, ID, NIC..."
            value={search}
            onChange={updateSearch}
            aria-label="Search applications"
          />
        </div>

        {/* Filter tabs */}
        <div className="applications-filter-tabs">
          {FILTERS.map((filter) => (
            <button
              type="button"
              key={filter}
              className={`applications-filter-tab ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => changeFilter(filter)}
            >
              {filter}
              <span>{counts[filter]}</span>
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="applications-message">
            <div className="applications-spinner" />
            <p>Loading applications...</p>
          </div>
        ) : error && applications.length === 0 ? (
          <div className="applications-message">
            <p>Applications could not be loaded.</p>

            <button
              type="button"
              className="applications-primary-btn"
              onClick={loadApplications}
            >
              Try Again
            </button>
          </div>
        ) : paginatedApplications.length === 0 ? (
          <div className="applications-message">
            <span className="applications-empty-icon">📂</span>
            <h3>No applications found</h3>

            <p>
              There are no applications matching this filter or search.
            </p>

            {activeFilter !== "All" && (
              <button
                type="button"
                className="applications-secondary-btn"
                onClick={() => changeFilter("All")}
              >
                View All Applications
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Applications table */}
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Application Type</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Recommendation</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedApplications.map((application) => {
                    const details = getApplicationDetails(application);
                    const status = getStatus(application);
                    const officerRecommendation =
                      getRecommendation(application);

                    return (
                      <tr key={application.id}>
                        <td className="applications-id-cell">
                          {getApplicationNumber(application)}
                        </td>

                        <td>
                          <strong>{getApplicantName(application)}</strong>

                          {(details.nic || details.NIC) && (
                            <small>
                              NIC: {details.nic || details.NIC}
                            </small>
                          )}
                        </td>

                        <td>
                          {details.application_type ||
                            details.service_type ||
                            details.service_name ||
                            application.service_name ||
                            details.type ||
                            "—"}
                        </td>

                        <td>
                          {formatDate(
                            application?.created_at ||
                              application?.submitted_at ||
                              application?.application_date
                          )}
                        </td>

                        <td>
                          <span
                            className={`applications-status status-${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          {officerRecommendation ? (
                            <span
                              className={`applications-recommendation recommendation-${getStatusClass(
                                officerRecommendation
                              )}`}
                            >
                              {officerRecommendation}
                            </span>
                          ) : (
                            <span className="applications-not-reviewed">
                              Not submitted
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="applications-view-btn"
                            onClick={() => openApplication(application)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="applications-pagination">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(
                  currentPage * pageSize,
                  filteredApplications.length
                )}{" "}
                of {filteredApplications.length}
              </span>

              <div className="applications-pagination-controls">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Application details modal */}
      {selectedApplication && (
        <ApplicationDetailsModal
          selectedApplication={selectedApplication}
          detailsLoading={detailsLoading}
          closeDetails={closeDetails}
          startReview={startReview}
          startingReview={startingReview}
          submitting={submitting}
          recommendation={recommendation}
          setRecommendation={setRecommendation}
          reviewNote={reviewNote}
          setReviewNote={setReviewNote}
          submitRecommendation={submitRecommendation}
          successMessage={successMessage}
        />
      )}
    </div>
  );
}

function ApplicationDetailsModal({
  selectedApplication,
  detailsLoading,
  closeDetails,
  startReview,
  startingReview,
  submitting,
  recommendation,
  setRecommendation,
  reviewNote,
  setReviewNote,
  submitRecommendation,
  successMessage,
}) {
  const details = getApplicationDetails(selectedApplication);

  return (
    <div
      className="applications-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDetails();
        }
      }}
    >
      <section
        className="applications-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-details-title"
      >
        <div className="applications-modal-header">
          <div>
            <span className="applications-modal-eyebrow">
              Application Details
            </span>

            <h2 id="application-details-title">
              {getApplicationNumber(selectedApplication)}
            </h2>
          </div>

          <button
            type="button"
            className="applications-modal-close"
            onClick={closeDetails}
            aria-label="Close application details"
          >
            ×
          </button>
        </div>

        {detailsLoading && (
          <p className="applications-loading-note">
            Loading additional details...
          </p>
        )}

        <div className="applications-details-grid">
          <Detail
            label="Applicant Name"
            value={getApplicantName(selectedApplication)}
          />

          <Detail
            label="Application Type"
            value={
              details.application_type ||
              details.service_type ||
              details.service_name ||
              selectedApplication.service_name ||
              details.type
            }
          />

          <Detail
            label="NIC"
            value={details.nic || details.NIC}
          />

          <Detail
            label="Email"
            value={
              details.email ||
              details.citizen_email ||
              details.user_email
            }
          />

          <Detail
            label="Phone"
            value={
              details.phone ||
              details.phone_number ||
              details.mobile ||
              details.mobile_number ||
              details.contact_number
            }
          />

          <Detail
            label="Address"
            value={
              details.address ||
              details.residential_address ||
              details.permanent_address
            }
          />

          <Detail
            label="Submitted Date"
            value={formatDate(
              selectedApplication.created_at ||
                selectedApplication.submitted_at
            )}
          />

          <Detail
            label="Current Status"
            value={getStatus(selectedApplication)}
          />
        </div>

        {(details.description || details.additional_details) && (
          <div className="applications-description">
            <h3>Application Description</h3>
            <p>
              {details.description || details.additional_details}
            </p>
          </div>
        )}

        {selectedApplication.officer_reviewed_at && (
          <p className="applications-review-date">
            Last reviewed:{" "}
            {formatDate(selectedApplication.officer_reviewed_at)}
          </p>
        )}

        {successMessage && (
          <div className="applications-alert applications-alert-success">
            {successMessage}
          </div>
        )}

        {getStatus(selectedApplication) === "Pending" && (
          <button
            type="button"
            className="applications-secondary-btn"
            onClick={startReview}
            disabled={startingReview || submitting}
          >
            {startingReview ? "Starting review..." : "Start Review"}
          </button>
        )}

        <form
          className="applications-review-form"
          onSubmit={submitRecommendation}
        >
          <h3>Officer Recommendation</h3>

          <label htmlFor="officer-recommendation">
            Recommendation <span>*</span>
          </label>

          <select
            id="officer-recommendation"
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
            required
          >
            <option value="">Select recommendation</option>

            <option value="Recommended for Approval">
              Recommended for Approval
            </option>

            <option value="Recommended for Rejection">
              Recommended for Rejection
            </option>
          </select>

          <label htmlFor="officer-review-note">Review Note</label>

          <textarea
            id="officer-review-note"
            rows={4}
            value={reviewNote}
            required
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Enter your observations or reasons..."
          />

          <div className="applications-modal-actions">
            <button
              type="button"
              className="applications-secondary-btn"
              onClick={closeDetails}
              disabled={submitting}
            >
              Close
            </button>

            <button
              type="submit"
              className="applications-primary-btn"
              disabled={submitting || detailsLoading}
            >
              {submitting
                ? "Submitting..."
                : "Submit Recommendation"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="applications-detail-item">
      <span>{label}</span>

      <strong>
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </strong>
    </div>
  );
}
