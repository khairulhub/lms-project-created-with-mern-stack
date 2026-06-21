import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiTrash2, FiUserCheck, FiSearch, FiPlus, FiX, FiSave } from "react-icons/fi";

const roleColors = { admin: "bg-red-500/10 text-red-400", instructor: "bg-purple-500/10 text-purple-400", user: "bg-cyan-500/10 text-cyan-400" };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createModal, setCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", password: "", designation: "" });
  const [creating, setCreating] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/admin/users").then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch { toast.error("Failed to update role"); }
  };

  const handleToggle = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      toast.success(data.message);
      fetchUsers();
    } catch { toast.error("Failed to toggle status"); }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      fetchUsers();
    } catch { toast.error("Delete failed"); }
  };

  const handleCreateInstructor = async () => {
    if (!newForm.name || !newForm.email || !newForm.password) return toast.error("Name, email & password required");
    setCreating(true);
    try {
      await api.post("/admin/create-instructor", newForm);
      toast.success("Instructor created!");
      setCreateModal(false);
      setNewForm({ name: "", email: "", password: "", designation: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create instructor");
    } finally { setCreating(false); }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <DashboardLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">All Users</h2>
            <p className="text-gray-400 text-sm">{filtered.length} of {users.length} users</p>
          </div>
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shrink-0">
            <FiPlus size={16} /> Create Instructor
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer">
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-400">User</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Role</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Joined</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-3"><div className="h-10 bg-gray-800 rounded-lg animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                        className="w-8 h-8 rounded-full bg-gray-700 shrink-0" alt={u.name} />
                      <div>
                        <p className="text-white text-sm font-medium">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer border-0 outline-none ${roleColors[u.role]}`}>
                      <option value="user">user</option>
                      <option value="instructor">instructor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleToggle(u._id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        u.isActive ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleDelete(u._id, u.name)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Instructor Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">Create Instructor</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm">Admin creates a new instructor directly with email & password.</p>
              {[
                { label: "Full Name *", key: "name", type: "text", placeholder: "Instructor name" },
                { label: "Email *", key: "email", type: "email", placeholder: "instructor@example.com" },
                { label: "Password *", key: "password", type: "password", placeholder: "Min 6 characters" },
                { label: "Designation", key: "designation", type: "text", placeholder: "e.g. Senior Developer" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <input type={type} value={newForm[key]} placeholder={placeholder}
                    onChange={(e) => setNewForm({ ...newForm, [key]: e.target.value })} className={inputClass} />
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleCreateInstructor} disabled={creating}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <FiSave size={15} /> {creating ? "Creating..." : "Create"}
              </button>
              <button onClick={() => setCreateModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
