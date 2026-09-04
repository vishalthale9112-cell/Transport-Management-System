import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  FileWarning,
  Search,
  ShieldAlert,
  Trash2,
  Wrench,
} from "lucide-react";

import {
  deleteNotification,
  getNotifications,
  getNotificationsSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";

import "./Notifications.css";

const getResponseData = (response) =>
  response?.data ?? response;

const formatDate = (dateValue) => {
  if (!dateValue) return "Recently";

  return new Date(dateValue).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeIcon = (type) => {
  if (type === "Document Expiry") {
    return <FileWarning size={21} />;
  }

  if (type === "Maintenance") {
    return <Wrench size={21} />;
  }

  if (type === "Insurance") {
    return <ShieldAlert size={21} />;
  }

  return <Bell size={21} />;
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({
    total_notifications: 0,
    unread_notifications: 0,
    high_priority: 0,
    document_alerts: 0,
    maintenance_alerts: 0,
    insurance_alerts: 0,
  });

  const [search, setSearch] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [priority, setPriority] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [notificationsResponse, summaryResponse] =
        await Promise.all([
          getNotifications({
            search,
            notificationType,
            priority,
            unreadOnly,
          }),
          getNotificationsSummary(),
        ]);

      setNotifications(
        getResponseData(notificationsResponse) || []
      );

      setSummary(
        getResponseData(summaryResponse) || {}
      );
    } catch (requestError) {
      console.error(requestError);
      setError("Notifications load karta alya nahi.");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    notificationType,
    priority,
    unreadOnly,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (requestError) {
      console.error(requestError);
      setError("Notification read karta ali nahi.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (requestError) {
      console.error(requestError);
      setError("Notifications update karta alya nahi.");
    }
  };

  const handleDelete = async (notificationId) => {
    const shouldDelete = window.confirm(
      "Delete this notification?"
    );

    if (!shouldDelete) return;

    try {
      await deleteNotification(notificationId);
      await loadNotifications();
    } catch (requestError) {
      console.error(requestError);
      setError("Notification delete karta ali nahi.");
    }
  };

  const summaryCards = [
    {
      title: "Total Notifications",
      value: summary.total_notifications || 0,
      icon: <Bell />,
      color: "blue",
    },
    {
      title: "Unread",
      value: summary.unread_notifications || 0,
      icon: <Bell />,
      color: "purple",
    },
    {
      title: "High Priority",
      value: summary.high_priority || 0,
      icon: <ShieldAlert />,
      color: "red",
    },
    {
      title: "Document Alerts",
      value: summary.document_alerts || 0,
      icon: <FileWarning />,
      color: "orange",
    },
    {
      title: "Maintenance",
      value: summary.maintenance_alerts || 0,
      icon: <Wrench />,
      color: "green",
    },
    {
      title: "Insurance",
      value: summary.insurance_alerts || 0,
      icon: <ShieldAlert />,
      color: "cyan",
    },
  ];

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <p className="page-label">
            THALE TRANSPORT
          </p>

          <h1>Notifications</h1>

          <p>
            Manage document, insurance and maintenance
            alerts.
          </p>
        </div>

        <button
          className="mark-all-button"
          onClick={handleMarkAllRead}
          disabled={
            loading ||
            summary.unread_notifications === 0
          }
        >
          <CheckCheck size={18} />
          Mark All as Read
        </button>
      </div>

      <div className="notification-summary-grid">
        {summaryCards.map((card) => (
          <div
            className="notification-summary-card"
            key={card.title}
          >
            <div
              className={`summary-icon ${card.color}`}
            >
              {card.icon}
            </div>

            <div>
              <span>{card.title}</span>
              <strong>{card.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="notification-filter-card">
        <div className="notification-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={notificationType}
          onChange={(event) =>
            setNotificationType(event.target.value)
          }
        >
          <option value="">All Types</option>
          <option value="Document Expiry">
            Document Expiry
          </option>
          <option value="Maintenance">
            Maintenance
          </option>
          <option value="Insurance">
            Insurance
          </option>
        </select>

        <select
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value)
          }
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <label className="unread-filter">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) =>
              setUnreadOnly(event.target.checked)
            }
          />
          Unread only
        </label>
      </div>

      {error && (
        <div className="notification-error">
          {error}
        </div>
      )}

      <div className="notification-list">
        {loading ? (
          <div className="notification-state">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty-state">
            <div className="empty-bell">
              <Bell size={32} />
            </div>

            <h3>No notifications found</h3>

            <p>
              New document, insurance and maintenance
              alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-item ${
                notification.is_read
                  ? "read"
                  : "unread"
              }`}
              key={notification.id}
            >
              <div
                className={`notification-type-icon ${
                  notification.priority?.toLowerCase() ||
                  "low"
                }`}
              >
                {getTypeIcon(
                  notification.notification_type
                )}
              </div>

              <div className="notification-content">
                <div className="notification-title-row">
                  <h3>{notification.title}</h3>

                  <span
                    className={`priority-badge ${
                      notification.priority?.toLowerCase() ||
                      "low"
                    }`}
                  >
                    {notification.priority || "Low"}
                  </span>
                </div>

                <p>{notification.message}</p>

                <div className="notification-meta">
                  <span>
                    {notification.notification_type}
                  </span>

                  <span>•</span>

                  <span>
                    {formatDate(
                      notification.created_at
                    )}
                  </span>
                </div>
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="read-button"
                    title="Mark as read"
                    onClick={() =>
                      handleMarkRead(notification.id)
                    }
                  >
                    <CheckCheck size={18} />
                  </button>
                )}

                <button
                  className="delete-button"
                  title="Delete notification"
                  onClick={() =>
                    handleDelete(notification.id)
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;