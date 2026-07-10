import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ChatThreadView from "../../components/chat/ChatThreadView";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

const StudentCourseChat = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get(`/course-chat/${courseId}`)
      .then(({ data }) => setChat(data))
      .catch((err) => setError(err.response?.data?.message || "চ্যাট লোড করা যায়নি"))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (text, attachments) => {
    const { data } = await api.post(`/course-chat/${courseId}/message`, { text, attachments });
    setChat(data);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <Link to={`/student/course/${courseId}`} className="text-gray-400 hover:text-white">
            <FiArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">
              {chat?.course?.title || "কোর্স ইন্সট্রাক্টরের সাথে চ্যাট"}
            </h1>
            <p className="text-gray-500 text-xs">Instructor / Admin এর সাথে সরাসরি কথা বলো</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-gray-900 border border-gray-800 rounded-xl p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : (
            <ChatThreadView
              messages={chat?.messages || []}
              currentUserId={user?._id}
              onSend={handleSend}
              emptyText="এখনো কোনো মেসেজ নেই — কোর্স নিয়ে কোনো প্রশ্ন থাকলে এখানে লিখো"
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseChat;
