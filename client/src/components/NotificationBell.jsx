import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";
import NotificationList from "./NotificationList";
import "./Notifications.css";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
  } = useNotifications({ loadInitially: open });

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell-button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        title="Notifications"
        onClick={() => setOpen((previous) => !previous)}
      >
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="notification-count-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown-panel">
          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            error={error}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onViewAll={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          />
        </div>
      )}
    </div>
  );
}
