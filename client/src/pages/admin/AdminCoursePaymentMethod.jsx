import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiRotateCcw } from "react-icons/fi";

// Default/fake values — used only to "reset" the settings panel in the UI,
// the real source of truth once saved is the single DB document.
const SETTINGS_DEFAULTS = {
  isActive: false,
  price: "৪,৫০০",
  oldPrice: "১২,০০০",
  discountText: "৬৩% ছাড়",
  bootcampFeeLabel: "বুটক্যাম্প ফি",
  bootcampFee: "৫,৫০০ টাকা",
  disclaimerBadgeText: "Disclaimer",
  disclaimerLine1: "৫৫০০ টাকায় ভর্তির এটাই শেষ সুযোগ,",
  disclaimerLine2: "পরের ব্যাচ থেকে ভর্তি ফি বেড়ে যাবে।",
  paymentButtonsLabel: "পেমেন্ট করো:",
  enrollButtonText: "ভর্তি হও →",
  enrollButtonLink: "/enroll",
  modalCloseButtonText: "বুঝেছি",
  modalStepsHeading: "কীভাবে পেমেন্ট করবে:",
};

const emptyMethodForm = {
  label: "", accountLabel: "", accountNumber: "", reference: "",
  steps: [""], isActive: true, order: 0,
};

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const AdminCoursePaymentMethod = () => {
  // ── Settings (singleton) state ──────────────────────────────────────────
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ── Payment methods (CRUD list) state ───────────────────────────────────
  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editMethod, setEditMethod] = useState(null);
  const [form, setForm] = useState(emptyMethodForm);
  const [saving, setSaving] = useState(false);

  const fetchSettings = () => {
    setSettingsLoading(true);
    api.get("/course-payment/settings")
      .then((res) => setSettings(res.data))
      .catch(() => toast.error("Settings load korte parlam na"))
      .finally(() => setSettingsLoading(false));
  };

  const fetchMethods = () => {
    setMethodsLoading(true);
    api.get("/admin/course-payment/methods")
      .then((res) => setMethods(res.data))
      .catch(() => toast.error("Payment method list load korte parlam na"))
      .finally(() => setMethodsLoading(false));
  };

  useEffect(() => { fetchSettings(); fetchMethods(); }, []);

  const setField = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-payment/settings", settings);
      setSettings(res.data);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSettingsSaving(false); }
  };

  const handleResetSettings = async () => {
    if (!window.confirm("Settings-er shob field default value-te reset hobe. Continue?")) return;
    setSettings(SETTINGS_DEFAULTS);
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-payment/settings", SETTINGS_DEFAULTS);
      setSettings(res.data);
      toast.success("Reset to default!");
    } catch {
      toast.error("Reset failed");
    } finally { setSettingsSaving(false); }
  };

  // ── Payment method CRUD ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditMethod(null);
    setForm({ ...emptyMethodForm, order: methods.length, steps: [""] });
    setModal(true);
  };

  const openEdit = (m) => {
    setEditMethod(m);
    setForm({
      label: m.label, accountLabel: m.accountLabel, accountNumber: m.accountNumber,
      reference: m.reference, steps: m.steps?.length ? m.steps : [""],
      isActive: m.isActive, order: m.order,
    });
    setModal(true);
  };

  const setStep = (idx, value) => {
    const steps = [...form.steps];
    steps[idx] = value;
    setForm({ ...form, steps });
  };

  // Admin can freely add more steps to a payment method's process — each
  // "+ Add Step" click appends a new editable line.
  const addStep = () => setForm({ ...form, steps: [...form.steps, ""] });

  const removeStep = (idx) => {
    const steps = form.steps.filter((_, i) => i !== idx);
    setForm({ ...form, steps: steps.length ? steps : [""] });
  };

  const handleSaveMethod = async () => {
    if (!form.label.trim()) return toast.error("Method label required (e.g. bKash)");
    setSaving(true);
    const payload = { ...form, steps: form.steps.map((s) => s.trim()).filter(Boolean) };
    try {
      if (editMethod) {
        await api.put(`/admin/course-payment/methods/${editMethod._id}`, payload);
        toast.success("Payment method updated!");
      } else {
        await api.post("/admin/course-payment/methods", payload);
        toast.success("Payment method created!");
      }
      setModal(false);
      fetchMethods();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDeleteMethod = async (id, label) => {
    if (!window.confirm(`Delete payment method "${label}"? Ei button-ta public page theke shoreya jabe.`)) return;
    try {
      await api.delete(`/admin/course-payment/methods/${id}`);
      toast.success("Payment method deleted");
      fetchMethods();
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (m) => {
    try {
      await api.put(`/admin/course-payment/methods/${m._id}`, { isActive: !m.isActive });
      fetchMethods();
    } catch { toast.error("Status update failed"); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Payment Method</h2>
        <p className="text-gray-400 text-sm">Course payment section-er price, active/inactive switch ar payment method (bKash/Nagad/...) gula এখান থেকে manage koro.</p>
      </div>

      {/* ════════════ SETTINGS PANEL ════════════ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-white font-semibold text-lg">Plan Settings</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setField("isActive", !settings.isActive)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center ${settings.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${settings.isActive ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-gray-300">
                {settings.isActive ? "Active (price card dekhabe)" : "Inactive (bootcamp fee card dekhabe)"}
              </span>
            </label>
            <button onClick={handleResetSettings}
              className="flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-xl text-xs transition-colors">
              <FiRotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {settingsLoading ? (
          <div className="h-40 bg-gray-800 rounded-xl animate-pulse" />
        ) : (
          <>
            {/* Active-card fields */}
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Active card (যখন Active on)</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Price (৳)</label>
                  <input value={settings.price} onChange={(e) => setField("price", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Old Price (৳)</label>
                  <input value={settings.oldPrice} onChange={(e) => setField("oldPrice", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Discount Badge Text</label>
                  <input value={settings.discountText} onChange={(e) => setField("discountText", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Inactive-card fields */}
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Inactive card (যখন Active off)</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Bootcamp Fee Label</label>
                  <input value={settings.bootcampFeeLabel} onChange={(e) => setField("bootcampFeeLabel", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bootcamp Fee (৳)</label>
                  <input value={settings.bootcampFee} onChange={(e) => setField("bootcampFee", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Disclaimer Badge Text</label>
                  <input value={settings.disclaimerBadgeText} onChange={(e) => setField("disclaimerBadgeText", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Disclaimer Line 1</label>
                  <input value={settings.disclaimerLine1} onChange={(e) => setField("disclaimerLine1", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Disclaimer Line 2</label>
                  <input value={settings.disclaimerLine2} onChange={(e) => setField("disclaimerLine2", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Shared fields */}
            <div>
              <p className="text-gray-300 text-sm font-medium mb-2">Shared text (দুই card-এই দেখা যাবে)</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>"পেমেন্ট করো:" Label</label>
                  <input value={settings.paymentButtonsLabel} onChange={(e) => setField("paymentButtonsLabel", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Modal Steps Heading</label>
                  <input value={settings.modalStepsHeading} onChange={(e) => setField("modalStepsHeading", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Enroll Button Text</label>
                  <input value={settings.enrollButtonText} onChange={(e) => setField("enrollButtonText", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Enroll Button Link</label>
                  <input value={settings.enrollButtonLink} onChange={(e) => setField("enrollButtonLink", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Modal Close Button Text</label>
                  <input value={settings.modalCloseButtonText} onChange={(e) => setField("modalCloseButtonText", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={settingsSaving}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              <FiSave size={15} /> {settingsSaving ? "Saving..." : "Save Settings"}
            </button>
          </>
        )}
      </div>

      {/* ════════════ PAYMENT METHODS CRUD ════════════ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Payment Methods</h3>
          <p className="text-gray-400 text-sm">{methods.length} total — public page-এ button hishebe dekhabe</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
          <FiPlus size={16} /> Add Payment Method
        </button>
      </div>

      {methodsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Kono payment method nei. Notun ekta create koro!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((m) => (
            <div key={m._id} className={`bg-gray-900 border rounded-xl p-5 transition-all ${m.isActive ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold text-sm">{m.label}</p>
                  <button onClick={() => toggleActive(m)}
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 transition-colors ${m.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                    {m.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteMethod(m._id, m.label)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              {m.accountNumber && <p className="text-gray-500 text-xs break-all">{m.accountLabel}: {m.accountNumber}</p>}
              <p className="text-gray-600 text-xs mt-2">{m.steps?.length || 0} steps · order {m.order}</p>
            </div>
          ))}
        </div>
      )}

      {/* ════════════ CREATE/EDIT MODAL ════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editMethod ? "Edit Payment Method" : "New Payment Method"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Method Label *</label>
                  <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. bKash" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Display Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Account Label</label>
                <input value={form.accountLabel} onChange={(e) => setForm({ ...form, accountLabel: e.target.value })}
                  placeholder="e.g. bKash নম্বর (Personal)" className={inputClass} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Account Number / Info</label>
                  <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="e.g. 01XXXXXXXXX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Reference Note</label>
                  <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="e.g. তোমার নাম / ফোন নম্বর" className={inputClass} />
                </div>
              </div>

              {/* Dynamic steps editor — admin can add/remove as many steps as needed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + " mb-0"}>Payment Steps</label>
                  <button type="button" onClick={addStep}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                    <FiPlus size={12} /> Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {form.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-purple-400 text-xs font-bold w-5">{i + 1}.</span>
                      <input value={step} onChange={(e) => setStep(i, e.target.value)}
                        placeholder={`Step ${i + 1}`} className={inputClass} />
                      <button type="button" onClick={() => removeStep(i)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-gray-300">Active (public page-e dekhabe)</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSaveMethod} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCoursePaymentMethod;
