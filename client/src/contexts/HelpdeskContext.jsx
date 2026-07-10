import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const HelpdeskContext = createContext();

// Student ("user") -> unread reply count (admin reply dise, dekhe nai emon)
// Admin -> open + in_progress ticket count (attention lagbe emon)
export const HelpdeskProvider = ({ children }) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const isUser = user?.role === "user";
  const isAdmin = user?.role === "admin";

  const refresh = useCallback(async () => {
    if (isUser) {
      try {
        const res = await api.get("/helpdesk/tickets/unread-count");
        setCount(res.data?.count || 0);
      } catch (_) {}
    } else if (isAdmin) {
      try {
        const res = await api.get("/admin/helpdesk/tickets/open-count");
        setCount(res.data?.count || 0);
      } catch (_) {}
    }
  }, [isUser, isAdmin]);

  useEffect(() => {
    if (!isUser && !isAdmin) {
      setCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [isUser, isAdmin, refresh]);

  return (
    <HelpdeskContext.Provider value={{ helpdeskCount: count, refreshHelpdeskCount: refresh }}>
      {children}
    </HelpdeskContext.Provider>
  );
};

export const useHelpdesk = () => useContext(HelpdeskContext);
