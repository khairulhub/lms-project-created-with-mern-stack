import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const SessionNotificationContext = createContext();

// Shudhu admin er jonno — session shesh hoye gele o "scheduled" thakle count dekhabe
export const SessionNotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [endedSessionsCount, setEndedSessionsCount] = useState(0);
  const isAdmin = user?.role === "admin";

  const refreshEndedCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("/admin/sessions/ended-count");
      setEndedSessionsCount(res.data?.count || 0);
    } catch (_) {}
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setEndedSessionsCount(0);
      return;
    }
    refreshEndedCount();
    const interval = setInterval(refreshEndedCount, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, refreshEndedCount]);

  return (
    <SessionNotificationContext.Provider value={{ endedSessionsCount, refreshEndedCount }}>
      {children}
    </SessionNotificationContext.Provider>
  );
};

export const useSessionNotifications = () => useContext(SessionNotificationContext);
