
import { Link } from "react-router-dom";
import { ArrowLeft, UserRound, Mail, Phone, MapPin, Save } from "lucide-react";
import { useState } from "react";

function Profile() {
  const [profile, setProfile] = useState({
    fullName: "Demo Citizen",
    email: "citizen@example.com",
    phone: "0771234567",
    address: "Colombo, Sri Lanka",
  });

  const handleChange = (event) => {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("Demo profile updated. Changes are not saved to a database.");
  };

  const fields = [
    { name: "fullName", label: "Full Name", type: "text", icon: UserRound },
    { name: "email", label: "Email Address", type: "email", icon: Mail },
    { name: "phone", label: "Phone Number", type: "tel", icon: Phone },
    { name: "address", label: "Residential Address", type: "text", icon: MapPin },
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
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
                {profile.fullName || "Citizen"}
              </h2>
              <p style={{ color: "#64748b", margin: 0 }}>Citizen Account · Demo</p>
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
                      required
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 20px",
                background: "#174ea6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              <Save size={18} />
              Update Profile
            </button>
          </form>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "18px" }}>
          Demonstration profile only. Information is not stored permanently.
        </p>
      </div>
    </div>
  );
}

export default Profile;