import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import {
  FiBookOpen, FiBookmark, FiBarChart2, FiAward,
  FiBell, FiZap, FiHeadphones, FiUser,
} from "react-icons/fi";

const quickLinks = [
  { to: "/student/enrolled",           icon: <FiBookOpen />,   label: "My Classes",         color: "cyan" },
  { to: "/student/bookmark",           icon: <FiBookmark />,   label: "Bookmark",           color: "purple" },
  { to: "/student/analysis",           icon: <FiBarChart2 />,  label: "My Analysis",        color: "green" },
  { to: "/student/leaderboard",        icon: <FiAward />,      label: "Leaderboard",        color: "yellow" },
  { to: "/student/announcement",       icon: <FiBell />,       label: "Announcements",      color: "red" },
  { to: "/student/conceptual-session", icon: <FiZap />,        label: "Conceptual Session", color: "orange" },
  { to: "/student/helpdesk",           icon: <FiHeadphones />, label: "Helpdesk",           color: "pink" },
  { to: "/student/profile",            icon: <FiUser />,       label: "My Profile",         color: "indigo" },
];

const colorMap = {
  cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-500/50",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/50",
  green:  "bg-green-500/10 text-green-400 border-green-500/20 hover:border-green-500/50",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:border-yellow-500/50",
  red:    "bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/50",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-orange-500/50",
  pink:   "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:border-pink-500/50",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50",
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certCount, setCertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get("/enrollments/my");
        if (cancelled) return;
        setEnrollments(data);

        const approved = data.filter((e) => e.status === "approved" && e.course);
        // প্রতিটা approved course এর certificate eligibility check করে —
        // certificateId থাকলে ধরে নিচ্ছি course টা completed
        const results = await Promise.all(
          approved.map((e) =>
            api
              .get(`/certificates/${e.course._id}/eligibility`)
              .then(({ data }) => !!data.certificateId)
              .catch(() => false)
          )
        );
        if (!cancelled) setCertCount(results.filter(Boolean).length);
      } catch (err) {
        console.error("StudentDashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const approvedCourses = enrollments.filter((e) => e.status === "approved" && e.course);
  const stats = [
    { label: "Enrolled Courses", value: loading ? "…" : String(approvedCourses.length), emoji: "📚" },
    { label: "Completed",        value: loading ? "…" : String(certCount),              emoji: "✅" },
    { label: "Certificates",     value: loading ? "…" : String(certCount),              emoji: "🏆" },
    { label: "Bookmarks",        value: "0",                                            emoji: "🔖" },
  ];

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            className="w-14 h-14 rounded-full bg-gray-700 border-2 border-gray-700"
            alt={user?.name}
          />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Enrolled Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">My Enrolled Courses</h2>
            {approvedCourses.length > 0 && (
              <Link to="/student/enrolled" className="text-cyan-400 text-sm hover:underline">
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : approvedCourses.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
              <p className="text-5xl mb-4">🎓</p>
              <p className="text-white font-semibold mb-2">No courses enrolled yet</p>
              <p className="text-gray-500 text-sm mb-6">Browse our courses and start learning today</p>
              <Link to="/"
                className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {approvedCourses.slice(0, 3).map((e) => (
                <Link
                  key={e._id}
                  to={`/student/course/${e.course._id}`}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors flex items-center gap-3"
                >
                  {e.course.thumbnail ? (
                    <img src={e.course.thumbnail} alt={e.course.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">📘</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{e.course.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Continue learning →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.to} to={item.to}
              className={`flex flex-col items-center gap-2 border rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 ${colorMap[item.color]}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
