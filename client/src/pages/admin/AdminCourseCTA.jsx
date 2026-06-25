import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSave, FiPlus, FiTrash2 } from "react-icons/fi";

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const PRESET_GRADIENTS = [
  { from: "#3b0764", via: "#1a0533", to: "#500724", label: "Purple-Red (Default)" },
  { from: "#1e3a5f", via: "#0f2027", to: "#203a43", label: "Deep Blue" },
  { from: "#0f4c3a", via: "#0d2e23", to: "#134e3a", label: "Dark Green" },
  { from: "#4a1942", via: "#2d0a3a", to: "#1a0533", label: "Magenta-Purple" },
  { from: "#1a1a2e", via: "#16213e", to: "#0f3460", label: "Midnight Blue" },
];

const AdminCourseCTA = () => {
  const [cta,     setCta]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [newBadge,setNewBadge]= useState("");

  const fetchCTA = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/course-cta"); setCta(res.data); }
    catch { toast.error("Data load korte parlam na"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCTA(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/admin/course-cta", cta);
      setCta(res.data); toast.success("CTA saved!");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const addBadge = () => {
    if (!newBadge.trim()) return;
    setCta((c) => ({ ...c, trustBadges: [...(c.trustBadges || []), newBadge.trim()] }));
    setNewBadge("");
  };

  const removeBadge = (i) => {
    setCta((c) => ({ ...c, trustBadges: c.trustBadges.filter((_, idx) => idx !== i) }));
  };

  const applyPreset = (preset) => {
    setCta((c) => ({ ...c, gradientFrom: preset.from, gradientVia: preset.via, gradientTo: preset.to }));
  };

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">CTA Section</h2>
        <p className="text-gray-400 text-sm">Page-এর সবচেয়ে নিচের "এখনই ভর্তি হও" section। দুটো button-ই login → /categories redirect করে।</p>
      </div>

      <div className="space-y-6">
        {/* Text content */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-lg">Content</h3>
          <div>
            <label className={labelClass}>Heading</label>
            <input value={cta?.heading || ""} onChange={(e) => setCta((c) => ({ ...c, heading: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea rows={3} value={cta?.subtitle || ""} onChange={(e) => setCta((c) => ({ ...c, subtitle: e.target.value }))} className={inputClass + " resize-none"} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Primary Button Text</label>
              <input value={cta?.primaryBtnText || ""} onChange={(e) => setCta((c) => ({ ...c, primaryBtnText: e.target.value }))} placeholder="এখনই ভর্তি হও — ৳৪,৫০০" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Secondary Button Text</label>
              <input value={cta?.secondaryBtnText || ""} onChange={(e) => setCta((c) => ({ ...c, secondaryBtnText: e.target.value }))} placeholder="Free Demo দেখো" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-lg">Trust Badges</h3>
          <div className="flex flex-wrap gap-2">
            {(cta?.trustBadges || []).map((badge, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
                <span className="text-gray-300 text-sm">{badge}</span>
                <button onClick={() => removeBadge(i)} className="text-gray-500 hover:text-red-400 transition-colors"><FiTrash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newBadge} onChange={(e) => setNewBadge(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBadge()}
              placeholder="✅ নতুন badge লেখো..." className={inputClass} />
            <button onClick={addBadge}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0">
              <FiPlus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Background gradient */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-lg">Background Gradient</h3>

          {/* Presets */}
          <div>
            <label className={labelClass}>Preset Gradients</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_GRADIENTS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  title={p.label}
                  className={`h-10 w-24 rounded-xl transition-all hover:scale-105 text-xs text-white font-medium ${cta?.gradientFrom === p.from ? "ring-2 ring-white" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.via}, ${p.to})` }}>
                  {p.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom colors */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "gradientFrom", label: "From" },
              { key: "gradientVia",  label: "Via" },
              { key: "gradientTo",   label: "To" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cta?.[key] || "#000000"}
                    onChange={(e) => setCta((c) => ({ ...c, [key]: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0" />
                  <input value={cta?.[key] || ""} onChange={(e) => setCta((c) => ({ ...c, [key]: e.target.value }))}
                    className={inputClass} placeholder="#3b0764" />
                </div>
              </div>
            ))}
          </div>

          {/* Live preview */}
          <div className="rounded-2xl p-8 text-center"
            style={{ background: `linear-gradient(135deg, ${cta?.gradientFrom || "#3b0764"}, ${cta?.gradientVia || "#1a0533"}, ${cta?.gradientTo || "#500724"})` }}>
            <p className="text-white font-extrabold text-lg mb-2">{cta?.heading}</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <span className="bg-white text-purple-900 font-bold text-sm px-4 py-2 rounded-xl">{cta?.primaryBtnText}</span>
              <span className="text-white border border-white/30 text-sm px-4 py-2 rounded-xl">{cta?.secondaryBtnText}</span>
            </div>
          </div>
        </div>

        {/* Active toggle + Save */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setCta((c) => ({ ...c, isActive: !c.isActive }))}
              className={`w-11 h-6 rounded-full transition-colors flex items-center ${cta?.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${cta?.isActive ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-gray-300 text-sm">Section Active (public page-এ দেখাবে)</span>
          </label>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            <FiSave size={15} /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseCTA;
