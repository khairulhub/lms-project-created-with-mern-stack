import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import { FiMenu, FiX, FiLogOut, FiSettings, FiUser, FiBookOpen,
         FiBookmark, FiHeadphones, FiBarChart2, FiAward, FiBell,
         FiZap, FiUsers, FiGrid } from "react-icons/fi";

// Student dropdown menu items with icons
const studentMenuItems = [
  { label: "Dashboard",          path: "/student/dashboard",          icon: <FiGrid size={15} /> },
  { label: "View Profile",       path: "/student/profile",            icon: <FiUser size={15} /> },
  { label: "My Classes",         path: "/student/my-classes",         icon: <FiBookOpen size={15} /> },
  { label: "Bookmark",           path: "/student/bookmark",           icon: <FiBookmark size={15} /> },
  { label: "Helpdesk",           path: "/student/helpdesk",           icon: <FiHeadphones size={15} /> },
  { label: "Student Analysis",   path: "/student/analysis",           icon: <FiBarChart2 size={15} /> },
  { label: "Leaderboard",        path: "/student/leaderboard",        icon: <FiAward size={15} /> },
  { label: "Announcement",       path: "/student/announcement",       icon: <FiBell size={15} /> },
  { label: "Conceptual Session", path: "/student/conceptual-session", icon: <FiZap size={15} /> },
  { label: "Settings",           path: "/student/settings",           icon: <FiSettings size={15} /> },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [navMenus, setNavMenus] = useState([]);
  const [siteConfig, setSiteConfig] = useState({ siteName: "LMS", logoText: "LMS", logoUrl: "", showLogoImage: false, enrollUrl: "/enroll" });
  const dropRef = useRef(null);

  // Load dynamic nav menus + site config from backend
  useEffect(() => {
    api.get("/nav/menus")
      .then((r) => setNavMenus(r.data))
      .catch((err) => console.error("Nav menus fetch failed:", err.response?.status, err.response?.data || err.message));
    api.get("/nav/config")
      .then((r) => setSiteConfig(r.data))
      .catch((err) => console.error("Site config fetch failed:", err.response?.status, err.response?.data || err.message));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "instructor") return "/instructor/dashboard";
    return "/student/dashboard";
  };

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── LOGO ──────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {siteConfig.showLogoImage && siteConfig.logoUrl ? (
              <img src={siteConfig.logoUrl} alt={siteConfig.siteName} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <span className="text-xl font-extrabold text-cyan-400 font-mono">{siteConfig.logoText}</span>
                <span className="hidden sm:block text-xl font-bold text-white font-mono">{siteConfig.siteName}</span>
              </>
            )}
          </Link>

          {/* ── DESKTOP NAV LINKS (dynamic from DB) ─── */}
          <div className="hidden md:flex items-center gap-6">
            {navMenus.map((item) => (
              <Link key={item._id} to={item.path}
                target={item.openInNewTab ? "_blank" : "_self"}
                className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">
                {item.label}
              </Link>
            ))}
          </div>

          {/* ── RIGHT SIDE ────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              /* ── User profile dropdown ── */
              <div className="relative" ref={dropRef}>
                <button onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 hover:bg-gray-800 px-2 py-1.5 rounded-xl transition-colors">
                  <img
                    src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover bg-gray-700 border-2 border-gray-700"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-white text-sm font-medium leading-tight">{user.name.split(" ")[0]}</p>
                    <p className="text-gray-500 text-xs leading-tight capitalize">{user.role}</p>
                  </div>
                </button>

                {/* Dropdown panel */}
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                    {/* User header */}
                    <div className="px-4 py-4 border-b border-gray-800 flex items-center gap-3">
                      <img
                        src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        className="w-11 h-11 rounded-full bg-gray-700 border-2 border-gray-700"
                        alt={user.name}
                      />
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-gray-500 text-xs truncate">{user.email}</p>
                        {user.studentId && <p className="text-cyan-400 text-xs font-mono">ID: {user.studentId}</p>}
                      </div>
                    </div>

                    {/* Admin/Instructor — show dashboard link */}
                    {(user.role === "admin" || user.role === "instructor") && (
                      <div className="px-2 py-2 border-b border-gray-800">
                        <Link to={getDashboardPath()} onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors">
                          <FiGrid size={15} /> {user.role === "admin" ? "Admin Panel" : "Instructor Panel"}
                        </Link>
                      </div>
                    )}

                    {/* Student menu items */}
                    <div className="px-2 py-2 max-h-72 overflow-y-auto">
                      {studentMenuItems.map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                          <span className="text-gray-500">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="px-2 py-2 border-t border-gray-800">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <FiLogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Not logged in ── */
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Login</Link>
                <Link to={siteConfig.enrollUrl}
                  className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-bold px-5 py-2 rounded-lg transition-colors">
                  Enroll Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-300 p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ─────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-1">
          {navMenus.map((item) => (
            <Link key={item._id} to={item.path} onClick={() => setMenuOpen(false)}
              className="block text-gray-300 hover:text-cyan-400 py-2.5 text-sm border-b border-gray-800 last:border-0">
              {item.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMenuOpen(false)}
                  className="text-gray-300 py-2 text-sm">Dashboard</Link>
                <button onClick={handleLogout} className="text-red-400 py-2 text-sm text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-300 py-2 text-sm">Login</Link>
                <Link to={siteConfig.enrollUrl} onClick={() => setMenuOpen(false)}
                  className="bg-cyan-500 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm text-center">
                  Enroll Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;