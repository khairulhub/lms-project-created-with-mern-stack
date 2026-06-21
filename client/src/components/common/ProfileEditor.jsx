import { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSave, FiImage } from "react-icons/fi";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const ProfileEditor = ({ user, onUpdate }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    designation: user?.designation || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    profileImage: user?.profileImage || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // imgBB image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_API_KEY) return toast.error("Add VITE_IMGBB_API_KEY to .env");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, profileImage: data.data.url }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch {
      toast.error("Upload error");
    } finally {
      setUploading(false);
    }
  };

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

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>

      {/* Avatar Preview */}
      <div className="flex items-center gap-5 mb-8 p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <div className="relative shrink-0">
          <img
            src={form.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover bg-gray-700 border-2 border-gray-700"
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`; }}
          />
          {/* Upload overlay */}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <FiImage size={18} className="text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          <p className="text-white font-semibold">{form.name || "Your Name"}</p>
          <p className="text-gray-400 text-sm">{form.designation || "Your Designation"}</p>
          <p className="text-gray-500 text-xs mt-0.5">{user?.email}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            user?.role === "admin" ? "bg-red-500/20 text-red-400" :
            user?.role === "instructor" ? "bg-purple-500/20 text-purple-400" :
            "bg-cyan-500/20 text-cyan-400"
          }`}>{user?.role}</span>
          <p className="text-gray-600 text-xs mt-1">Hover on photo to change</p>
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

        <button onClick={handleSave} disabled={saving || uploading}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-6 py-3 rounded-xl transition-colors">
          <FiSave size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfileEditor;
