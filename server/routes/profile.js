
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/citizen/profile";

function Profile() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("dsmsToken");

      if (!token) {
        setError("Please log in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        const user = data.user;

        setProfile({
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
        });
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Save updated profile to database
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("dsmsToken");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    if (!profile.full_name.trim() || !profile.email.trim()) {
      setError("Full name and email address are required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      const user = data.user;

      setProfile({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });

      // Keep stored login user details in sync
      const storedUser = localStorage.getItem("dsmsUser");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          localStorage.setItem(
            "dsmsUser",
            JSON.stringify({
              ...parsedUser,
              full_name: user.full_name,
              email: user.email,
            })
          );
        } catch {
          // Profile update already succeeded; ignore stale local user data.
        }
      }

      setSuccess(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      name: "full_name",
      label: "Full Name",
      type: "text",
      icon: UserRound,
      placeholder: "Enter your full name",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      icon: Mail,
      placeholder: "Enter your email address",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      placeholder: "Enter your phone number",
      required: false,
    },
    {
      name: "address",
      label: "Residential Address",
      type: "text",
      icon: MapPin,
      placeholder: "Enter your residential address",
      required: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/citizen/dashboard"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Account Settings
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-3 text-slate-500">
            View and update your personal information.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 py-7 sm:px-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <UserRound size={32} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900">
                {profile.full_name || "Citizen"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Citizen Account
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-blue-700"
                />
                <p>Loading your profile...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                  >
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                    <p>{success}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {fields.map((field) => {
                      const Icon = field.icon;

                      return (
                        <div key={field.name}>
                          <label
                            htmlFor={field.name}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            {field.label}
                            {field.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </label>

                          <div className="relative">
                            <Icon
                              size={18}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              id={field.name}
                              name={field.name}
                              type={field.type}
                              value={profile[field.name]}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              required={field.required}
                              maxLength={field.name === "email" ? 254 : 255}
                              disabled={saving}
                              autoComplete={
                                field.name === "full_name"
                                  ? "name"
                                  : field.name === "email"
                                    ? "email"
                                    : field.name === "phone"
                                      ? "tel"
                                      : "street-address"
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                      Fields marked * are required.
                    </p>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
