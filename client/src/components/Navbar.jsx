
import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  Menu,
  UserRound,
  User,
  LogOut,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

function Navbar({ onMenuClick }) {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // Read user information saved during login
  let storedUser = {};

  try {
    const parsedUser = JSON.parse(
      localStorage.getItem("dsmsUser") || "{}"
    );
    if (parsedUser && typeof parsedUser === "object") {
      storedUser = parsedUser;
    }
  } catch {
    // Use the default profile labels when saved user data is invalid.
  }

  const userName =
    storedUser.full_name ||
    storedUser.name ||
    storedUser.username ||
    "Citizen User";

  const userRole =
    storedUser.role_name ||
    storedUser.role ||
    "Citizen Account";

  function handleProfile() {
    setProfileOpen(false);
    navigate("/citizen/profile");
  }

  function handleApplications() {
    setProfileOpen(false);
    navigate("/citizen/applications");
  }

  function handleSignOut() {
    localStorage.removeItem("dsmsToken");
    localStorage.removeItem("dsmsUser");
    navigate("/login", { replace: true });
  }

  function toggleProfile() {
    setProfileOpen((previous) => !previous);
  }

  return (
    <header className="dsms-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={23} />
        </button>

        <div className="navbar-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search services or applications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search services or applications"
          />
        </div>
      </div>

      <div className="navbar-right">
        <NotificationBell />

        <div className="navbar-divider" />

        {/* Profile button and dropdown */}
        <div
          className="navbar-dropdown-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className="navbar-profile"
            onClick={toggleProfile}
            aria-label="User profile"
            aria-expanded={profileOpen}
          >
            <div className="navbar-avatar">
              <UserRound size={21} />
            </div>

            <div className="navbar-user-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>

            <ChevronDown
              size={17}
              className="navbar-chevron"
            />
          </button>

          {profileOpen && (
            <div className="navbar-dropdown profile-dropdown">
              <div className="navbar-dropdown-user">
                <div className="navbar-avatar">
                  <UserRound size={21} />
                </div>

                <div>
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>
              </div>

              <div className="navbar-dropdown-divider" />

              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={handleProfile}
              >
                <User size={17} />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={handleApplications}
              >
                <FileText size={17} />
                <span>My Applications</span>
              </button>

              <div className="navbar-dropdown-divider" />

              <button
                type="button"
                className="navbar-dropdown-item navbar-logout-item"
                onClick={handleSignOut}
              >
                <LogOut size={17} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
