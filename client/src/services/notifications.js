const API_URL = "http://localhost:5000/api";

async function notificationRequest(path, options = {}) {
  const token = localStorage.getItem("dsmsToken");
  const response = await fetch(`${API_URL}/notifications${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to load notifications.");
  }

  return data;
}

export function getNotifications() {
  return notificationRequest("");
}

export function getUnreadNotificationCount() {
  return notificationRequest("/unread-count");
}

export function markNotificationRead(notificationId) {
  return notificationRequest(`/${notificationId}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return notificationRequest("/read-all", { method: "PATCH" });
}
