import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationList from "../components/NotificationList";
import useNotifications from "../hooks/useNotifications";
import "../components/Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications({ loadInitially: true });

  return (
    <main className="notifications-page">
      <button
        type="button"
        className="notifications-back-button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={17} />
        Back
      </button>
      <div className="notifications-page-heading">
        <div>
          <p>DSMS ACCOUNT</p>
          <h1>Notifications</h1>
          <span>
            {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </span>
        </div>
        <button
          type="button"
          className="notifications-refresh-button"
          onClick={refreshNotifications}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <NotificationList
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        pageMode
      />
    </main>
  );
}
