"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Info, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

function relativeTime(dateString) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    );
    try {
      const updated = await api.patch(`/notifications/${id}/read`, { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: null } : n))
      );
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.readAt);
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
    );
    await Promise.all(
      unread.map((n) => api.patch(`/notifications/${n.id}/read`, { read: true }))
    ).catch(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.readAt && !unread.find((u) => u.id === n.id) ? n : { ...n, readAt: null }))
      );
    }).finally(() => fetchNotifications());
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your operations</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading notifications...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle size={20} className="mr-2" />
          {error}
          <button onClick={fetchNotifications} className="ml-3 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-center text-gray-500 py-12">No notifications yet</p>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markAsRead(n.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${
                n.readAt ? "bg-white border-gray-200" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  n.type === "success" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {n.type === "success" ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Info size={16} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-500 mt-1">{relativeTime(n.createdAt)}</p>
              </div>
              {!n.readAt && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
