import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";
const EMPTY_FORM  = { question: "", answer: "", isActive: true, order: 0 };

const AdminCourseFAQ = () => {
  const [settings,       setSettings]       = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [faqs,           setFaqs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState(false);
  const [editFAQ,        setEditFAQ]        = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        api.get("/admin/course-faq/settings"),
        api.get("/admin/course-faq"),
      ]);
      setSettings(sRes.data);
      setFaqs(fRes.data);
    } catch { toast.error("Data load korte parlam na"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-faq/settings", { heading: settings.heading, subtitle: settings.subtitle });
      setSettings(res.data); toast.success("Settings saved!");
    } catch { toast.error("Save failed"); }
    finally { setSettingsSaving(false); }
  };

  const openCreate = () => { setEditFAQ(null); setForm({ ...EMPTY_FORM, order: faqs.length }); setModal(true); };
  const openEdit   = (f) => { setEditFAQ(f); setForm({ question: f.question, answer: f.answer, isActive: f.isActive, order: f.order }); setModal(true); };

  const handleSave = async () => {
    if (!form.question.trim()) return toast.error("Question required");
    if (!form.answer.trim())   return toast.error("Answer required");
    setSaving(true);
    try {
      if (editFAQ) { await api.put(`/admin/course-faq/${editFAQ._id}`, form); toast.success("Updated!"); }
      else         { await api.post("/admin/course-faq", form);                toast.success("Created!"); }
      setModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, q) => {
    if (!window.confirm(`Delete FAQ: "${q.slice(0, 40)}..."?`)) return;
    try { await api.delete(`/admin/course-faq/${id}`); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (f) => {
    try { await api.put(`/admin/course-faq/${f._id}`, { isActive: !f.isActive }); fetchAll(); }
    catch { toast.error("Status update failed"); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">FAQ Section</h2>
        <p className="text-gray-400 text-sm">"সচরাচর জিজ্ঞাসা" section — সব active FAQ গুলো দেখাবে।</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : (<>

        {/* Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-white font-semibold text-lg">Section Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Heading</label>
              <input value={settings?.heading || ""} onChange={(e) => setSettings((s) => ({ ...s, heading: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <input value={settings?.subtitle || ""} onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={settingsSaving}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <FiSave size={14} /> {settingsSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* FAQs List */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">FAQs</h3>
            <p className="text-gray-400 text-sm">{faqs.length} total · {faqs.filter(f => f.isActive).length} active দেখাবে</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            <FiPlus size={16} /> Add FAQ
          </button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-center text-gray-600 py-10">Kono FAQ nei.</p>
        ) : (
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f._id}
                className={`bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 transition-opacity ${!f.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{f.question}</p>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button onClick={() => toggleActive(f)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${f.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                      {f.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                    <button onClick={() => handleDelete(f._id, f.question)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>)}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editFAQ ? "Edit FAQ" : "New FAQ"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Question *</label>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="কোনো পূর্ব অভিজ্ঞতা ছাড়া কি এই কোর্স করা যাবে?" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Answer *</label>
                <textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="হ্যাঁ! একদম শুরু থেকে শেখানো হয়।" className={inputClass + " resize-none"} />
              </div>
              <div>
                <label className={labelClass}>Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputClass} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourseFAQ;
