import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAnnouncements } from "../../contexts/AnnouncementContext";
import { useSessionNotifications } from "../../contexts/SessionNotificationContext";
import { useHelpdesk } from "../../contexts/HelpdeskContext";
import { useCourseChat } from "../../contexts/CourseChatContext";
import {
  FiHome, FiUser, FiUsers, FiFileText, FiTag, FiLogOut,
  FiMenu, FiX, FiCheckCircle, FiGlobe, FiBookOpen, FiChevronDown, FiChevronRight, FiMessageSquare, FiAward, FiBell, FiVideo, FiHeadphones, FiTrendingUp, FiHeart,
} from "react-icons/fi";

const DashboardLayout = ({ children, hidePadding = false }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useAnnouncements() || {};
  const { endedSessionsCount } = useSessionNotifications() || {};
  const { helpdeskCount } = useHelpdesk() || {};
  const { chatUnreadCount } = useCourseChat() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Tracks open/closed state PER submenu group (keyed by label), so clicking
  // one group (e.g. "Categories") never affects another group's open state
  // (e.g. "Course Details"). Previously this was a single shared boolean,
  // which caused every group to open/close together.
  const [openGroups, setOpenGroups] = useState({
    "Course Details": location.pathname.startsWith("/admin/course-details"),
    "Categories": location.pathname.startsWith("/admin/categories") || location.pathname.startsWith("/admin/courses"),
    "Reviews": location.pathname.startsWith("/admin/reviews"),
    "My Profile": location.pathname.startsWith("/student/profile") || location.pathname.startsWith("/student/certificates"),
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const adminLinks = [
    { to: "/admin/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/admin/users", icon: <FiUsers />, label: "All Users" },
    { to: "/admin/instructor-requests", icon: <FiCheckCircle />, label: "Instructor Requests" },
    { to: "/admin/categories", icon: <FiTag />, label: "Categories",
      children: [
        { to: "/admin/categories", label: "All Categories" },
        { to: "/admin/courses",    label: "Courses" },
      ],
    },
    { to: "/admin/blogs", icon: <FiFileText />, label: "Blogs" },
    { to: "/admin/announcements", icon: <FiBell />, label: "Announcements" },
    { to: "/admin/sessions", icon: <FiVideo />, label: "Sessions", badge: endedSessionsCount },
    { to: "/admin/helpdesk", icon: <FiHeadphones />, label: "Helpdesk", badge: helpdeskCount },
    { to: "/admin/messages", icon: <FiMessageSquare />, label: "Messages", badge: chatUnreadCount },
    { to: "/admin/coupons", icon: <FiTag />, label: "Coupons" },
    { to: "/admin/enrollments", icon: <FiCheckCircle />, label: "Enrollments" },
    { to: "/admin/quiz-assignment", icon: <FiAward />, label: "Quiz & Assignment" },
    {
      label: "Reviews",
      icon: <FiMessageSquare />,
      children: [
        { to: "/admin/reviews/course-reviews",      label: "Course Review" },
        { to: "/admin/reviews/instructor-reviews",  label: "Instructor Review" },
      ],
    },
    {
      label: "Course Details",
      icon: <FiBookOpen />,
      // Aro section future-e ei children list e add hobe (apatoto 1ta — Hero Section)
      children: [
        { to: "/admin/course-details/hero-section", label: "Course Hero Section" },
        { to: "/admin/course-details/payment-method", label: "Payment Method" },
        { to: "/admin/course-details/highlights", label: "Highlights Section" },
        { to: "/admin/course-details/video", label: "Video Section" },
        { to: "/admin/course-details/what-you-learn", label: "What You'll Learn" },
        { to: "/admin/course-details/curriculum", label: "Curriculum Section" },
        { to: "/admin/course-details/projects", label: "Projects Section" },
        { to: "/admin/course-details/career", label: "Career Section" },
        { to: "/admin/course-details/reviews", label: "Reviews Section" },
        { to: "/admin/course-details/faq",     label: "FAQ Section" },
        { to: "/admin/course-details/cta",     label: "CTA Section" },
      ],
    },
    { to: "/admin/navbar", icon: <FiGlobe />, label: "Navbar Settings" },
    { to: "/admin/profile", icon: <FiUser />, label: "My Profile" },
  ];

  const instructorLinks = [
    { to: "/instructor/dashboard", icon: <FiHome />,      label: "Dashboard"  },
    { to: "/instructor/courses",   icon: <FiBookOpen />,  label: "My Courses" },
    { to: "/instructor/announcements", icon: <FiBell />, label: "Announcements", badge: unreadCount },
    { to: "/instructor/sessions", icon: <FiVideo />, label: "Sessions" },
    { to: "/instructor/messages", icon: <FiMessageSquare />, label: "Messages", badge: chatUnreadCount },
    { to: "/instructor/blogs",     icon: <FiFileText />,  label: "My Blogs"   },
    { to: "/instructor/profile",   icon: <FiUser />,      label: "My Profile" },
  ];

  const userLinks = [
    { to: "/student/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/student/enrolled", icon: <FiFileText />, label: "My Classes", badge: chatUnreadCount },
    { to: "/student/bookmark", icon: <FiTag />, label: "Bookmark" },
    { to: "/student/wishlist", icon: <FiHeart />, label: "Wishlist" },
    { to: "/student/analysis", icon: <FiTrendingUp />, label: "Analysis" },
    { to: "/student/leaderboard", icon: <FiAward />, label: "Leaderboard" },
    { to: "/student/announcement", icon: <FiBell />, label: "Announcement", badge: unreadCount },
    { to: "/student/conceptual-session", icon: <FiVideo />, label: "Conceptual Session" },
    { to: "/student/helpdesk", icon: <FiHeadphones />, label: "Helpdesk", badge: helpdeskCount },
    {
      label: "My Profile",
      icon: <FiUser />,
      children: [
        { to: "/student/profile", label: "Profile" },
        { to: "/student/certificates", label: "Certificates" },
      ],
    },
    { to: "/user/instructor-request", icon: <FiCheckCircle />, label: "Become Instructor" },
  ];

  const links =
    user?.role === "admin" ? adminLinks :
    user?.role === "instructor" ? instructorLinks :
    userLinks;

  const roleColors = {
    admin: "text-red-400 bg-red-500/10",
    instructor: "text-purple-400 bg-purple-500/10",
    user: "text-cyan-400 bg-cyan-500/10",
  };

  const Sidebar = () => (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-cyan-400 font-mono">MERN Starter</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover bg-gray-700"
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) =>
          link.children ? (
            // Expandable group, e.g. "Course Details" -> "Course Hero Section"
            <div key={link.label}>
              <button
                onClick={() => toggleGroup(link.label)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </span>
                {openGroups[link.label] ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </button>
              {openGroups[link.label] && (
                <div className="ml-6 mt-1 space-y-1 border-l border-gray-800 pl-3">
                  {link.children.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-gray-500 hover:text-white hover:bg-gray-800"
                        }`
                      }
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {!!link.badge && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold">
                  {link.badge > 9 ? "9+" : link.badge}
                </span>
              )}
            </NavLink>
          )
        )}

        <div className="pt-2 border-t border-gray-800 mt-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FiGlobe className="text-base" /> View Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut className="text-base" /> Logout
          </button>
        </div>
      </nav>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col w-64">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <span className="text-cyan-400 font-bold font-mono">MERN Starter</span>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-300">
            <FiMenu size={22} />
          </button>
        </div>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${hidePadding ? "flex flex-col" : "p-4 md:p-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
