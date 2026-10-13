import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";

export default function useNotifications({ loadInitially = false } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCount = useCallback(async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(Number(data.unread_count) || 0);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  const refreshNotifications = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unread_count) || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (notificationId) => {
    setError("");
    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((notification) =>
          String(notification.notification_id) === String(notificationId)
            ? { ...notification, is_read: 1 }
            : notification
        )
      );
      await refreshCount();
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [refreshCount]);

  const markAllRead = useCallback(async () => {
    setError("");
    try {
      await markAllNotificationsRead();
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      if (loadInitially) {
        refreshNotifications();
      } else {
        refreshCount();
      }
    }, 0);

    const timer = window.setInterval(() => {
      if (loadInitially) {
        refreshNotifications(false);
      } else {
        refreshCount();
      }
    }, 30000);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [loadInitially, refreshCount, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markRead,
    markAllRead,
  };
}
