import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  FiHome, FiUser, FiUsers, FiFileText, FiTag, FiLogOut,
  FiMenu, FiX, FiCheckCircle, FiGlobe,
} from "react-icons/fi";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const adminLinks = [
    { to: "/admin/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/admin/users", icon: <FiUsers />, label: "All Users" },
    { to: "/admin/instructor-requests", icon: <FiCheckCircle />, label: "Instructor Requests" },
    { to: "/admin/categories", icon: <FiTag />, label: "Categories" },
    { to: "/admin/blogs", icon: <FiFileText />, label: "Blogs" },
    { to: "/admin/profile", icon: <FiUser />, label: "My Profile" },
  ];

  const instructorLinks = [
    { to: "/instructor/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/instructor/blogs", icon: <FiFileText />, label: "My Blogs" },
    { to: "/instructor/profile", icon: <FiUser />, label: "My Profile" },
  ];

  const userLinks = [
    { to: "/user/dashboard", icon: <FiHome />, label: "Dashboard" },
    { to: "/user/profile", icon: <FiUser />, label: "My Profile" },
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
        {links.map((link) => (
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
            {link.label}
          </NavLink>
        ))}

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
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
