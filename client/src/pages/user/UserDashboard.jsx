import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Link } from "react-router-dom";
import { FiUser, FiCheckCircle, FiBookOpen } from "react-icons/fi";

const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome, {user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-gray-400 mb-8">Here's your user dashboard</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Account Role", value: user?.role, icon: <FiUser />, color: "cyan" },
            { label: "Email", value: user?.email, icon: <FiBookOpen />, color: "purple" },
            { label: "Status", value: user?.isActive ? "Active" : "Inactive", icon: <FiCheckCircle />, color: "green" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className={`text-${stat.color}-400 mb-2`}>{stat.icon}</div>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white font-semibold text-sm truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/user/profile"
            className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-cyan-500/40 rounded-xl p-5 transition-all group">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <FiUser size={18} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Edit Profile</p>
              <p className="text-gray-500 text-xs">Update your name, bio & photo</p>
            </div>
          </Link>

          <Link to="/user/instructor-request"
            className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-xl p-5 transition-all group">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Become Instructor</p>
              <p className="text-gray-500 text-xs">Apply to teach on this platform</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
