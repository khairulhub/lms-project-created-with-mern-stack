import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ChatThreadView from "../../components/chat/ChatThreadView";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import toast from "react-hot-toast";

const ThreadListItem = ({ t, active, onClick }) => {
  const isUnread = t.lastMessageBy === "student" &&
    (!t.lastSeenByStaff || new Date(t.lastMessageAt) > new Date(t.lastSeenByStaff));
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-800 transition-colors ${active ? "bg-gray-800" : "hover:bg-gray-800/50"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-white text-sm font-medium truncate">{t.student?.name}</p>
        {isUnread && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
      </div>
      <p className="text-gray-500 text-xs truncate mt-0.5">{t.course?.title}</p>
      <p className={`text-xs truncate mt-1 ${isUnread ? "text-gray-300" : "text-gray-500"}`}>
        {t.lastMessageBy !== "student" && "তুমি: "}{t.lastMessageText || "..."}
      </p>
    </button>
  );
};

// role prop: "instructor" | "admin" — API base path আলাদা, বাকি সব identical
const ChatInbox = ({ role }) => {
  const { user } = useAuth();
  const base = role === "admin" ? "/admin/course-chat" : "/instructor/course-chat";

  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  const loadThreads = useCallback(() => {
    api.get(`${base}/threads`)
      .then(({ data }) => setThreads(data))
      .catch(() => toast.error("Chat list load করা যায়নি"))
      .finally(() => setLoadingThreads(false));
  }, [base]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = (id) => {
    setActiveId(id);
    setLoadingChat(true);
    api.get(`${base}/${id}`)
      .then(({ data }) => setActiveChat(data))
      .catch(() => toast.error("Thread load করা যায়নি"))
      .finally(() => setLoadingChat(false));
  };

  const handleSend = async (text, attachments) => {
    const { data } = await api.post(`${base}/${activeId}/message`, { text, attachments });
    setActiveChat(data);
    loadThreads();
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Messages</h1>
        <p className="text-gray-400 mb-6">Student দের সাথে course নিয়ে কথা বলো</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 420 }}>
          {/* Thread list */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto">
            {loadingThreads ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center text-gray-500 text-sm p-8">এখনো কোনো মেসেজ আসেনি</div>
            ) : (
              threads.map((t) => (
                <ThreadListItem key={t._id} t={t} active={activeId === t._id} onClick={() => openThread(t._id)} />
              ))
            )}
          </div>

          {/* Active thread */}
          <div className="md:col-span-2 p-4 flex flex-col min-h-0">
            {!activeId ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center">
                বাম দিক থেকে একটা conversation সিলেক্ট করো
              </div>
            ) : loadingChat || !activeChat ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="mb-3 pb-3 border-b border-gray-800 shrink-0">
                  <p className="text-white font-semibold text-sm">{activeChat.student?.name}</p>
                  <p className="text-gray-500 text-xs">{activeChat.course?.title}</p>
                </div>
                <ChatThreadView
                  messages={activeChat.messages || []}
                  currentUserId={user?._id}
                  onSend={handleSend}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatInbox;
