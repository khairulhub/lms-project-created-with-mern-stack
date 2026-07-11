import { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

// ── imgBB screenshot upload ───────────────────────────────────────────────────
const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!data.success) throw new Error("Screenshot upload failed");
  return data.data.url;
};

// ── Payment method definitions ────────────────────────────────────────────────
const BD_METHODS = [
  {
    id: "bKash",
    label: "bKash",
    emoji: "📱",
    color: "#E2136E",
    hint: "Send Money → Personal Number",
    txPlaceholder: "যেমন: 8BJ2KX9Q",
    needsScreenshot: true,
  },
  {
    id: "Nagad",
    label: "Nagad",
    emoji: "🟠",
    color: "#F7941D",
    hint: "Send Money → Personal Number",
    txPlaceholder: "যেমন: NAG-123456",
    needsScreenshot: true,
  },
  {
    id: "Rocket",
    label: "Rocket",
    emoji: "🚀",
    color: "#8B3A8B",
    hint: "Send Money → Personal Number",
    txPlaceholder: "যেমন: RKT-789012",
    needsScreenshot: true,
  },
];

const INTL_METHODS = [
  {
    id: "Stripe",
    label: "Stripe",
    emoji: "💳",
    color: "#635BFF",
    hint: "Visa, Mastercard, American Express",
    txPlaceholder: "Stripe Payment Intent ID (pi_...)",
    needsScreenshot: false,
  },
  {
    id: "PayPal",
    label: "PayPal",
    emoji: "🅿️",
    color: "#003087",
    hint: "PayPal account দিয়ে pay করো",
    txPlaceholder: "PayPal Transaction ID",
    needsScreenshot: false,
  },
];

// ── Method button ─────────────────────────────────────────────────────────────
const MethodBtn = ({ method, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(method)}
    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-[1.03]"
    style={{
      border: selected ? `1.5px solid ${method.color}` : "1.5px solid #2d1b4e",
      background: selected ? `${method.color}22` : "#150a2e",
      color: selected ? method.color : "#9ca3af",
      boxShadow: selected ? `0 0 10px ${method.color}33` : "none",
    }}
  >
    <span>{method.emoji}</span>
    <span>{method.label}</span>
  </button>
);

// ── Main modal ────────────────────────────────────────────────────────────────
const EnrollmentModal = ({ course, couponData, finalPrice, onClose, onSuccess }) => {
  const [tab, setTab] = useState("bd"); // "bd" | "intl"
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingAuto, setPayingAuto] = useState(false);

  const handleAutoPay = async () => {
    setPayingAuto(true);
    try {
      const { data } = await api.post("/payments/sslcommerz/init", {
        courseId: course._id,
        couponCode: couponData?.code || "",
      });
      window.location.href = data.gatewayUrl; // SSLCommerz checkout page-এ নিয়ে যাবে
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment শুরু করা যায়নি।");
      setPayingAuto(false);
    }
  };

  const allMethods = tab === "bd" ? BD_METHODS : INTL_METHODS;

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setTransactionId("");
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) return toast.error("Payment method select করো।");
    if (!transactionId.trim()) return toast.error("Transaction ID দাও।");

    try {
      setSubmitting(true);
      let screenshotUrl = "";
      if (screenshot) {
        setUploading(true);
        screenshotUrl = await uploadToImgBB(screenshot);
        setUploading(false);
      }

      await api.post("/enrollments", {
        courseId: course._id,
        paymentMethod: selectedMethod.id,
        transactionId: transactionId.trim(),
        screenshotUrl,
        couponCode: couponData?.code || "",
        amountPaid: finalPrice,
      });

      toast.success("Enrollment request পাঠানো হয়েছে! Admin approve করলে জানাবো।");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-purple-900 relative overflow-hidden"
        style={{ background: "#0a0118", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Glow top bar ─────────────────────────────────────────────── */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#7c3aed,#3b82f6,#06b6d4,#db2777)" }}
        />

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-purple-900/60 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Enrollment & Payment</h2>
            <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[280px]">{course?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all text-xl leading-none"
          >×</button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#6d28d9 #0a0118" }}>

          {/* Amount card */}
          <div
            className="rounded-xl p-4 mb-5 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg,#1a0533,#150a2e)", border: "1px solid #2d1b4e" }}
          >
            <div>
              <p className="text-gray-400 text-xs mb-1">মোট পেমেন্ট</p>
              <p className="text-white font-extrabold text-2xl">৳{finalPrice?.toLocaleString()}</p>
              {couponData?.code && (
                <p className="text-green-400 text-xs mt-1">✓ Coupon {couponData.code} applied</p>
              )}
            </div>
            <div className="text-right">
              <span
                className="inline-block text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid #7c3aed55" }}
              >
                Secure Payment 🔒
              </span>
            </div>
          </div>

          {/* ── Automated payment — instant approval, kono admin wait lagbe na ── */}
          <button
            onClick={handleAutoPay}
            disabled={payingAuto}
            className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl mb-3 text-sm transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(90deg,#059669,#06b6d4)", color: "#fff",
              opacity: payingAuto ? 0.7 : 1,
            }}
          >
            {payingAuto ? "Redirect হচ্ছে..." : "⚡ Pay Now — bKash / Nagad / Card (Instant Approval)"}
          </button>
          <p className="text-center text-gray-500 text-xs mb-4">
            SSLCommerz দিয়ে secure payment — সফল হলেই সাথে সাথে enroll হয়ে যাবে, admin approval লাগবে না।
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-purple-900/60" />
            <span className="text-gray-500 text-xs">অথবা manual পদ্ধতিতে পে করো</span>
            <div className="flex-1 h-px bg-purple-900/60" />
          </div>

          {/* Region tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "bd",   label: "🇧🇩 Bangladesh" },
              { key: "intl", label: "🌍 International" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSelectedMethod(null); setTransactionId(""); setScreenshot(null); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: tab === key ? "linear-gradient(90deg,#7c3aed,#4f46e5)" : "#150a2e",
                  color: tab === key ? "#fff" : "#6b7280",
                  border: tab === key ? "1px solid #7c3aed" : "1px solid #2d1b4e",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* International note */}
          {tab === "intl" && (
            <div
              className="rounded-xl p-3 mb-4 text-xs"
              style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.25)", color: "#a5b4fc" }}
            >
              💡 International payment-এর জন্য Stripe বা PayPal ব্যবহার করো। Payment করার পর Transaction ID দাও।
            </div>
          )}

          {/* Method buttons */}
          <div className="mb-5">
            <p className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">Payment Method বেছে নাও</p>
            <div className="flex flex-wrap gap-2">
              {allMethods.map((m) => (
                <MethodBtn
                  key={m.id}
                  method={m}
                  selected={selectedMethod?.id === m.id}
                  onSelect={handleMethodSelect}
                />
              ))}
            </div>
          </div>

          {/* Selected method detail */}
          {selectedMethod && (
            <div
              className="rounded-xl p-4 mb-4 space-y-4"
              style={{ background: "#150a2e", border: `1px solid ${selectedMethod.color}44` }}
            >
              {/* Hint */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedMethod.emoji}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedMethod.label}</p>
                  <p className="text-gray-400 text-xs">{selectedMethod.hint}</p>
                </div>
              </div>

              {/* SSL Commerz specific notice */}
              {selectedMethod.id === "SSL Commerz" && (
                <div
                  className="rounded-lg p-3 text-xs"
                  style={{ background: "rgba(0,166,81,0.08)", border: "1px solid rgba(0,166,81,0.25)", color: "#6ee7b7" }}
                >
                  SSL Commerz gateway-এ গিয়ে payment করো। সফল হলে SSL Transaction ID দিয়ে এখানে submit করো।
                </div>
              )}

              {/* Stripe specific notice */}
              {selectedMethod.id === "Stripe" && (
                <div
                  className="rounded-lg p-3 text-xs"
                  style={{ background: "rgba(99,91,255,0.08)", border: "1px solid rgba(99,91,255,0.3)", color: "#c7d2fe" }}
                >
                  Stripe checkout থেকে payment করো। Confirmation email-এ Payment Intent ID পাবে (<span className="font-mono">pi_...</span> দিয়ে শুরু)।
                </div>
              )}

              {/* Transaction ID */}
              <div>
                <label className="block text-gray-300 text-xs font-medium mb-1.5">
                  Transaction ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={selectedMethod.txPlaceholder}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full rounded-xl border text-white px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none transition-colors font-mono"
                  style={{
                    background: "#0a0118",
                    border: transactionId ? `1px solid ${selectedMethod.color}88` : "1px solid #2d1b4e",
                  }}
                />
              </div>

              {/* Screenshot upload — only for manual methods */}
              {selectedMethod.needsScreenshot && (
                <div>
                  <label className="block text-gray-300 text-xs font-medium mb-1.5">
                    Payment Screenshot
                    <span className="text-gray-500 font-normal ml-1">(দিলে দ্রুত approve হয়)</span>
                  </label>
                  <label
                    className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: "#0a0118",
                      borderColor: screenshot ? selectedMethod.color : "#2d1b4e",
                    }}
                  >
                    <span className="text-xl shrink-0">{screenshot ? "✅" : "📸"}</span>
                    <span className="text-xs" style={{ color: screenshot ? "#a78bfa" : "#6b7280" }}>
                      {screenshot ? screenshot.name : "ছবি select করতে click করো"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setScreenshot(e.target.files[0] || null)}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Warning note */}
          <div
            className="rounded-xl p-3 mb-5 text-xs"
            style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", color: "#fde68a99" }}
          >
            ⚠️ Payment সম্পন্ন করার পরই এই form submit করো। Admin verify করার পর তোমার dashboard-এ কোর্স চলে যাবে।
          </div>
        </div>

        {/* ── Footer — always visible ───────────────────────────────────── */}
        <div className="px-6 pb-6 pt-3 border-t border-purple-900/40 shrink-0" style={{ background: "#0a0118" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedMethod || !transactionId.trim()}
            className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}
          >
            {uploading
              ? "📤 Screenshot upload হচ্ছে..."
              : submitting
              ? "⏳ Submit হচ্ছে..."
              : `Enrollment Submit করো →`}
          </button>
          <p className="text-center text-gray-600 text-xs mt-2">🔒 তোমার তথ্য সম্পূর্ণ নিরাপদ</p>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentModal;
