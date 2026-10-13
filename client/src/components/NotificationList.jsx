import { Bell, Check, CheckCheck } from "lucide-react";

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value || "")
    : date.toLocaleString();
}

export default function NotificationList({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  pageMode = false,
}) {
  return (
    <section
      className={`notification-list ${pageMode ? "notification-list-page" : ""}`}
      aria-label="Notifications"
    >
      <div className="notification-list-header">
        <strong>{pageMode ? "Your Notifications" : "Notifications"}</strong>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notification-text-action"
            onClick={onMarkAllRead}
          >
            <CheckCheck size={15} />
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <p className="notification-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="notification-state" role="status">
          Loading notifications...
        </p>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <Bell size={27} />
          <strong>No notifications yet</strong>
          <span>Application updates will appear here.</span>
        </div>
      ) : (
        <ul className="notification-items">
          {notifications.map((notification) => {
            const unread = Number(notification.is_read) === 0;

            return (
              <li
                key={notification.notification_id}
                className={`notification-item ${unread ? "is-unread" : ""}`}
              >
                <div className="notification-item-content">
                  <div className="notification-item-heading">
                    <strong>{notification.title}</strong>
                    <span>{unread ? "Unread" : "Read"}</span>
                  </div>
                  <p>{notification.message}</p>
                  <time dateTime={notification.created_at}>
                    {formatDate(notification.created_at)}
                  </time>
                </div>
                {unread && (
                  <button
                    type="button"
                    className="notification-mark-read"
                    aria-label={`Mark "${notification.title}" as read`}
                    title="Mark as read"
                    onClick={() =>
                      onMarkRead(notification.notification_id)
                    }
                  >
                    <Check size={17} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {onViewAll && (
        <button
          type="button"
          className="notification-view-all"
          onClick={onViewAll}
        >
          View All Notifications
        </button>
      )}
    </section>
  );
}
