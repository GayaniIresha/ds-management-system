import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserRound, Mail, Phone, MapPin, Save } from "lucide-react";

const PROFILE_URL = "http://localhost:5000/api/citizen/profile";

const emptyProfile = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
};

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = localStorage.getItem("dsmsToken");
      if (!token) {
        localStorage.removeItem("dsmsUser");
        window.location.replace("/login");
        return;
      }

      try {
        const response = await fetch(PROFILE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await readResponse(response);

        if (response.status === 401) {
          localStorage.removeItem("dsmsToken");
          localStorage.removeItem("dsmsUser");
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your profile.");
        }
        if (!data.user || typeof data.user !== "object") {
          throw new Error("The server returned an invalid profile.");
        }

        if (active) {
          setProfile({
            full_name: data.user.full_name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
          });
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message === "Failed to fetch"
              ? "Cannot connect to the server. Please check the backend."
              : loadError.message
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setSuccess("");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const token = localStorage.getItem("dsmsToken");
    if (!token) {
      localStorage.removeItem("dsmsUser");
      window.location.replace("/login");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(PROFILE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await readResponse(response);

      if (response.status === 401) {
        localStorage.removeItem("dsmsToken");
        localStorage.removeItem("dsmsUser");
        window.location.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to update your profile.");
      }
      if (!data.user || typeof data.user !== "object") {
        throw new Error("The server did not return the updated profile.");
      }

      const updatedProfile = {
        full_name: data.user.full_name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
      };
      setProfile(updatedProfile);

      try {
        const storedUser = JSON.parse(localStorage.getItem("dsmsUser") || "{}");
        localStorage.setItem(
          "dsmsUser",
          JSON.stringify({ ...storedUser, ...data.user })
        );
      } catch (storageError) {
        console.error("Unable to synchronize the cached DSMS user.", storageError);
      }

      setSuccess(data.message || "Profile updated successfully.");
    } catch (saveError) {
      setError(
        saveError.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check the backend."
          : saveError.message
      );
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    {
      name: "full_name",
      label: "Full Name",
      type: "text",
      icon: UserRound,
      autoComplete: "name",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      icon: Mail,
      autoComplete: "email",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      autoComplete: "tel",
    },
    {
      name: "address",
      label: "Residential Address",
      type: "text",
      icon: MapPin,
      autoComplete: "street-address",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: "32px" }}>
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

      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <h1 style={{ color: "#172b4d", marginBottom: "8px" }}>My Profile</h1>
        <p style={{ color: "#64748b", marginBottom: "28px" }}>
          View and update your profile information.
        </p>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e7edf5",
            borderRadius: "14px",
            padding: "28px",
          }}
        >
          {loading ? (
            <p role="status" style={{ color: "#64748b" }}>
              Loading profile...
            </p>
          ) : (
            <>
              {error && (
                <p role="alert" style={{ color: "#b42318", marginTop: 0 }}>
                  {error}
                </p>
              )}
              {success && (
                <p role="status" style={{ color: "#067647", marginTop: 0 }}>
                  {success}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "#eaf2ff",
                    color: "#174ea6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserRound size={32} />
                </div>

                <div>
                  <h2 style={{ color: "#172b4d", margin: "0 0 6px" }}>
                    {profile.full_name || "Citizen"}
                  </h2>
                  <p style={{ color: "#64748b", margin: 0 }}>Citizen Account</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {fields.map((field) => {
                  const Icon = field.icon;

                  return (
                    <div key={field.name} style={{ marginBottom: "22px" }}>
                      <label
                        htmlFor={field.name}
                        style={{
                          display: "block",
                          color: "#334155",
                          fontWeight: 600,
                          marginBottom: "8px",
                        }}
                      >
                        {field.label}
                      </label>

                      <div style={{ position: "relative" }}>
                        <Icon
                          size={18}
                          color="#64748b"
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        />

                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          value={profile[field.name]}
                          onChange={handleChange}
                          autoComplete={field.autoComplete}
                          required={field.required}
                          disabled={saving}
                          style={{
                            width: "100%",
                            padding: "12px 12px 12px 40px",
                            border: "1px solid #d9e1ec",
                            borderRadius: "8px",
                            outlineColor: "#174ea6",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: saving ? "#64748b" : "#174ea6",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Update Profile"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
