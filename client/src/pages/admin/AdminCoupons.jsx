import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiTag, FiPercent, FiDollarSign, FiCalendar, FiUsers,
  FiCheckCircle, FiXCircle, FiCopy,
} from "react-icons/fi";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("bn-BD") : "—";
const inputCls = "w-full bg-gray-900 border border-purple-900 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelCls = "block text-xs text-gray-400 mb-1.5";

const EMPTY = {
  code: "",
  discountType: "percent",
  discountValue: "",
  validFrom: "",
  validTill: "",
  applicableTo: [],
  maxUses: "",
  isActive: true,
  description: "",
};

// ── Modal form ────────────────────────────────────────────────────────────────
const CouponModal = ({ coupon, courses, onClose, onSaved }) => {
  const isEdit = !!coupon?._id;
  const [form, setForm] = useState(
    isEdit
      ? {
          ...coupon,
          validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : "",
          validTill: coupon.validTill ? coupon.validTill.slice(0, 10) : "",
          discountValue: coupon.discountValue ?? "",
          maxUses: coupon.maxUses ?? "",
          applicableTo: (coupon.applicableTo || []).map((c) =>
            typeof c === "object" ? c._id : c
          ),
        }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCourse = (id) => {
    setForm((f) => ({
      ...f,
      applicableTo: f.applicableTo.includes(id)
        ? f.applicableTo.filter((x) => x !== id)
        : [...f.applicableTo, id],
    }));
  };

  const save = async () => {
    if (!form.code.trim()) return toast.error("কুপন কোড দেওয়া আবশ্যক");
    if (!form.discountValue) return toast.error("Discount value দেওয়া আবশ্যক");

    setSaving(true);
    const body = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue),
      maxUses: form.maxUses !== "" ? Number(form.maxUses) : null,
      validFrom: form.validFrom || null,
      validTill: form.validTill || null,
    };

    try {
      if (isEdit) {
        await api.put(`/admin/coupons/${coupon._id}`, body);
        toast.success("কুপন আপডেট হয়েছে!");
      } else {
        await api.post("/admin/coupons", body);
        toast.success("নতুন কুপন তৈরি হয়েছে!");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-purple-800 p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "#150a2e" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-6">
          {isEdit ? "কুপন এডিট করো" : "নতুন কুপন তৈরি করো"}
        </h3>

        <div className="space-y-4">
          {/* Code */}
          <div>
            <label className={labelCls}>কুপন কোড *</label>
            <input
              className={inputCls}
              placeholder="MERN50"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ডিসকাউন্ট ধরন *</label>
              <select
                className={inputCls}
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="percent">শতাংশ (%)</option>
                <option value="flat">সরাসরি টাকা (৳)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                মান * {form.discountType === "percent" ? "(0–100)" : "(টাকা)"}
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                max={form.discountType === "percent" ? 100 : undefined}
                placeholder={form.discountType === "percent" ? "20" : "500"}
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>শুরুর তারিখ</label>
              <input
                className={inputCls}
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>শেষ তারিখ</label>
              <input
                className={inputCls}
                type="date"
                value={form.validTill}
                onChange={(e) => set("validTill", e.target.value)}
              />
            </div>
          </div>

          {/* Max uses */}
          <div>
            <label className={labelCls}>সর্বোচ্চ ব্যবহার (খালি রাখলে unlimited)</label>
            <input
              className={inputCls}
              type="number"
              min="1"
              placeholder="100"
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>বিবরণ (ঐচ্ছিক)</label>
            <input
              className={inputCls}
              placeholder="রমজান স্পেশাল অফার"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Applicable courses */}
          <div>
            <label className={labelCls}>
              প্রযোজ্য কোর্সসমূহ (খালি রাখলে সব কোর্সে চলবে)
            </label>
            {courses.length === 0 ? (
              <p className="text-gray-500 text-xs">কোনো কোর্স পাওয়া যায়নি।</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-purple-900 p-3"
                style={{ background: "#0d011f" }}>
                {courses.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.applicableTo.includes(c._id)}
                      onChange={() => toggleCourse(c._id)}
                      className="accent-cyan-500"
                    />
                    <span className="text-gray-300 text-sm">{c.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">সক্রিয়</span>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                form.isActive ? "bg-cyan-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  form.isActive ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-purple-800 text-gray-400 hover:text-white text-sm transition-colors"
          >
            বাতিল
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}
          >
            {saving ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করো" : "তৈরি করো"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | coupon object (empty {} for create)

  const load = async () => {
    setLoading(true);
    try {
      const [cpRes, csRes] = await Promise.allSettled([
        api.get("/admin/coupons"),
        api.get("/admin/courses"),
      ]);
      if (cpRes.status === "fulfilled") setCoupons(cpRes.value.data);
      if (csRes.status === "fulfilled") setCourses(csRes.value.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/admin/coupons/${id}/toggle`);
      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: res.data.isActive } : c))
      );
      toast.success("স্ট্যাটাস পরিবর্তন হয়েছে");
    } catch {
      toast.error("Error toggling coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("এই কুপনটি মুছে দেওয়া হবে। নিশ্চিত?")) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      toast.success("কুপন মুছে দেওয়া হয়েছে");
    } catch {
      toast.error("Error deleting coupon");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`"${code}" কপি হয়েছে`);
  };

  return (
    <DashboardLayout>
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">কুপন ম্যানেজমেন্ট</h1>
          <p className="text-gray-500 text-sm mt-1">
            কোর্সে ডিসকাউন্ট কুপন তৈরি ও পরিচালনা করো
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/coupons/analytics" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            📊 Analytics দেখো
          </Link>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}
          >
            <FiPlus size={16} /> নতুন কুপন
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "মোট কুপন", val: coupons.length, icon: FiTag, color: "#7c3aed" },
          {
            label: "সক্রিয়",
            val: coupons.filter((c) => c.isActive).length,
            icon: FiCheckCircle,
            color: "#22c55e",
          },
          {
            label: "নিষ্ক্রিয়",
            val: coupons.filter((c) => !c.isActive).length,
            icon: FiXCircle,
            color: "#ef4444",
          },
        ].map(({ label, val, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-purple-900 p-4"
            style={{ background: "#150a2e" }}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} style={{ color }} />
              <div>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white font-bold text-xl">{val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-purple-800 p-16 text-center"
          style={{ background: "#150a2e" }}
        >
          <FiTag size={40} className="text-purple-600 mx-auto mb-4" />
          <p className="text-gray-300 font-semibold mb-1">কোনো কুপন নেই</p>
          <p className="text-gray-500 text-sm">
            উপরের "নতুন কুপন" বাটনে ক্লিক করে প্রথম কুপনটি তৈরি করো।
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: "#1a0533" }}>
              <tr>
                <th className="text-left text-gray-400 font-semibold px-5 py-3.5">কোড</th>
                <th className="text-left text-gray-400 font-semibold px-4 py-3.5">ডিসকাউন্ট</th>
                <th className="text-left text-gray-400 font-semibold px-4 py-3.5 hidden md:table-cell">মেয়াদ</th>
                <th className="text-left text-gray-400 font-semibold px-4 py-3.5 hidden lg:table-cell">ব্যবহার</th>
                <th className="text-left text-gray-400 font-semibold px-4 py-3.5">স্ট্যাটাস</th>
                <th className="text-right text-gray-400 font-semibold px-5 py-3.5">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody style={{ background: "#0d011f" }}>
              {coupons.map((c, i) => {
                const expired = c.validTill && new Date() > new Date(c.validTill);
                const notStarted = c.validFrom && new Date() < new Date(c.validFrom);
                const maxed = c.maxUses !== null && c.usedCount >= c.maxUses;

                return (
                  <tr
                    key={c._id}
                    className="border-t border-purple-950"
                    style={i % 2 === 0 ? {} : { background: "#0f0125" }}
                  >
                    {/* Code */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 text-sm">
                          {c.code}
                        </span>
                        <button
                          onClick={() => copyCode(c.code)}
                          className="text-gray-600 hover:text-gray-300 transition-colors"
                          title="কপি করো"
                        >
                          <FiCopy size={13} />
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{c.description}</p>
                      )}
                      {c.applicableTo?.length > 0 && (
                        <p className="text-purple-400 text-xs mt-0.5">
                          {c.applicableTo.length}টি কোর্সে সীমিত
                        </p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={
                          c.discountType === "percent"
                            ? { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                            : { background: "rgba(251,146,60,0.15)", color: "#fb923c" }
                        }
                      >
                        {c.discountType === "percent" ? (
                          <><FiPercent size={10} /> {c.discountValue}%</>
                        ) : (
                          <>৳{c.discountValue}</>
                        )}
                      </span>
                    </td>

                    {/* Validity */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="text-gray-400 text-xs space-y-0.5">
                        <p>
                          {c.validFrom ? fmtDate(c.validFrom) : "শুরু নেই"} →{" "}
                          {c.validTill ? fmtDate(c.validTill) : "শেষ নেই"}
                        </p>
                        {expired && (
                          <span className="text-red-400 font-semibold">মেয়াদ শেষ</span>
                        )}
                        {notStarted && (
                          <span className="text-yellow-400 font-semibold">শুরু হয়নি</span>
                        )}
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className={`text-xs ${maxed ? "text-red-400" : "text-gray-400"}`}>
                        {c.usedCount} / {c.maxUses ?? "∞"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggle(c._id)}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        style={{ color: c.isActive ? "#22c55e" : "#6b7280" }}
                      >
                        {c.isActive ? (
                          <FiToggleRight size={18} />
                        ) : (
                          <FiToggleLeft size={18} />
                        )}
                        {c.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal(c)}
                          className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                          title="এডিট"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="মুছো"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <CouponModal
          coupon={modal._id ? modal : null}
          courses={courses}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
    </DashboardLayout>
  );
};

export default AdminCoupons;
