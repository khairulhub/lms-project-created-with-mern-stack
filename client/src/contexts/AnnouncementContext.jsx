import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const AnnouncementContext = createContext();

// Shudhu student ("user") ar instructor announcement feed use kore, admin na
const RELEVANT_ROLES = ["user", "instructor"];

export const AnnouncementProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const isRelevant = !!user && RELEVANT_ROLES.includes(user.role);

  const refreshUnreadCount = useCallback(async () => {
    if (!isRelevant) return;
    try {
      const res = await api.get("/announcements/unread-count");
      setUnreadCount(res.data?.count || 0);
    } catch (_) {
      // silent — sidebar badge shudhu best-effort
    }
  }, [isRelevant]);

  useEffect(() => {
    if (!isRelevant) {
      setUnreadCount(0);
      return;
    }
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000); // প্রতি ১ মিনিটে refresh
    return () => clearInterval(interval);
  }, [isRelevant, refreshUnreadCount]);

  // Announcement modal open korle call hobe — server e mark kore, locally count decrement kore
  const markAsRead = useCallback(async (announcementId, wasUnread) => {
    try {
      await api.post(`/announcements/${announcementId}/read`);
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  }, []);

  return (
    <AnnouncementContext.Provider value={{ unreadCount, refreshUnreadCount, markAsRead }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = () => useContext(AnnouncementContext);
