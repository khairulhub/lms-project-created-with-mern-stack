import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "instructor") return "/instructor/dashboard";
    return "/user/dashboard";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">MERN</span>
            <span className="text-2xl font-bold text-white font-mono">Starter</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">Home</Link>
            <Link to="/blogs" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">Blogs</Link>
            <Link to="/categories" className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium">Categories</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <img
                    src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover bg-gray-600"
                  />
                  <span className="text-sm text-white font-medium">{user.name.split(" ")[0]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "admin" ? "bg-red-500/20 text-red-400" :
                    user.role === "instructor" ? "bg-purple-500/20 text-purple-400" :
                    "bg-cyan-500/20 text-cyan-400"
                  }`}>{user.role}</span>
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <FiSettings size={16} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { setDropOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Login</Link>
                <Link to="/signup" className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-bold px-4 py-2 rounded-lg transition-colors">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 py-2 text-sm">Home</Link>
          <Link to="/blogs" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 py-2 text-sm">Blogs</Link>
          <Link to="/categories" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 py-2 text-sm">Categories</Link>
          {user ? (
            <>
              <Link to={getDashboardPath()} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 py-2 text-sm">Dashboard</Link>
              <button onClick={handleLogout} className="block text-red-400 py-2 text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-gray-300 py-2 text-sm">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="block bg-cyan-500 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm text-center">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
