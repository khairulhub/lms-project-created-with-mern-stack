import { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSave, FiUser } from "react-icons/fi";

const ProfileEditor = ({ user, onUpdate }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    designation: user?.designation || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    profileImage: user?.profileImage || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", form);
      toast.success("Profile updated!");
      onUpdate && onUpdate(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>

      {/* Avatar Preview */}
      <div className="flex items-center gap-5 mb-8 p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <img
          src={form.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover bg-gray-700 border-2 border-gray-700"
          onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`; }}
        />
        <div>
          <p className="text-white font-semibold">{form.name || "Your Name"}</p>
          <p className="text-gray-400 text-sm">{form.designation || "Your Designation"}</p>
          <p className="text-gray-500 text-xs mt-1">{user?.email}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            user?.role === "admin" ? "bg-red-500/20 text-red-400" :
            user?.role === "instructor" ? "bg-purple-500/20 text-purple-400" :
            "bg-cyan-500/20 text-cyan-400"
          }`}>{user?.role}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Designation</label>
          <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="e.g. Full Stack Developer" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Profile Image URL</label>
          <input value={form.profileImage} onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
            placeholder="https://example.com/photo.jpg" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+880 1234 567890" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4} placeholder="Tell us about yourself..."
            className={inputClass + " resize-none"} />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-6 py-3 rounded-xl transition-colors">
          <FiSave size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfileEditor;
