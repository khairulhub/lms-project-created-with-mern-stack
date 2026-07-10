import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../utils/api";

const CourseChatContext = createContext();

// role অনুযায়ী alada endpoint theke unread count fetch kore — 30s polling
export const CourseChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const endpoint =
    user?.role === "admin" ? "/admin/course-chat/unread-count" :
    user?.role === "instructor" ? "/instructor/course-chat/unread-count" :
    user?.role === "user" ? "/course-chat/unread-count" :
    null;

  const refresh = useCallback(async () => {
    if (!endpoint) return;
    try {
      const { data } = await api.get(endpoint);
      setCount(data?.count || 0);
    } catch (_) {}
  }, [endpoint]);

  useEffect(() => {
    if (!endpoint) { setCount(0); return; }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [endpoint, refresh]);

  return (
    <CourseChatContext.Provider value={{ chatUnreadCount: count, refreshChatUnreadCount: refresh }}>
      {children}
    </CourseChatContext.Provider>
  );
};

export const useCourseChat = () => useContext(CourseChatContext);
