
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  UserRound,
  Building2,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar({ isOpen = true, onClose }) {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/citizen/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Available Services",
      path: "/citizen/services",
      icon: Building2,
    },
    {
      label: "My Applications",
      path: "/citizen/applications",
      icon: ClipboardList,
    },
    {
      label: "My Documents",
      path: "/citizen/documents",
      icon: FileText,
    },
    {
      label: "My Profile",
      path: "/citizen/profile",
      icon: UserRound,
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      <aside className={`dsms-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ShieldCheck size={27} />
          </div>

          <div className="sidebar-brand-text">
            <h2>DSMS</h2>
            <p>Citizen Portal</p>
          </div>

          <button
            className="sidebar-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <ShieldCheck size={22} />
            <div>
              <strong>Need Assistance?</strong>
              <p>Contact your divisional office.</p>
            </div>
          </div>

          <NavLink
            to="/login"
            className="sidebar-link sidebar-logout"
            onClick={onClose}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </NavLink>

          <p className="sidebar-version">DSMS Prototype · v1.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

