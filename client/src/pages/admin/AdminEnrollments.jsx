// client/src/pages/admin/AdminEnrollments.jsx
// নতুন file — App.jsx এ route add করতে হবে।

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending:  { bg: "rgba(234,179,8,0.1)",  color: "#fbbf24", border: "rgba(234,179,8,0.3)" },
  approved: { bg: "rgba(5,150,105,0.15)", color: "#34d399", border: "rgba(5,150,105,0.3)" },
  rejected: { bg: "rgba(239,68,68,0.1)",  color: "#f87171", border: "rgba(239,68,68,0.3)" },
  revoked:  { bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.3)" },
};

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, revoked: 0, total: 0 });
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { enrollment, action }
  const [adminNote, setAdminNote] = useState("");
  const [markRefunded, setMarkRefunded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.allSettled([
      api.get(`/admin/enrollments?status=${tab}`),
      api.get("/admin/enrollments/stats"),
    ]).then(([enrollRes, statsRes]) => {
      if (enrollRes.status === "fulfilled") setEnrollments(enrollRes.value.data);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [tab]);

  const openActionModal = (enrollment, action) => {
    setActionModal({ enrollment, action });
    setAdminNote("");
    setMarkRefunded(false);
    setPaymentDetails(null);

    if (action === "revoke") {
      setLoadingPayment(true);
      api.get(`/admin/enrollments/${enrollment._id}/payment-details`)
        .then(({ data }) => setPaymentDetails(data))
        .catch(() => setPaymentDetails(null))
        .finally(() => setLoadingPayment(false));
    }
  };

  const handleReview = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      if (actionModal.action === "revoke") {
        await api.put(`/admin/enrollments/${actionModal.enrollment._id}/revoke`, {
          reason: adminNote,
          markRefunded,
        });
        toast.success("🚫 Access revoke করা হয়েছে।");
      } else {
        await api.put(`/admin/enrollments/${actionModal.enrollment._id}/review`, {
          action: actionModal.action,
          adminNote,
        });
        toast.success(
          actionModal.action === "approve"
            ? "✅ Enrollment approve করা হয়েছে!"
            : "❌ Enrollment reject করা হয়েছে।"
        );
      }
      setActionModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("এই enrollment delete করবে?")) return;
    try {
      await api.delete(`/admin/enrollments/${id}`);
      toast.success("Deleted.");
      fetchData();
    } catch {
      toast.error("Delete করা যায়নি।");
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Enrollment Requests</h1>
        <p className="text-gray-400 mb-6">Student-দের enrollment request approve বা reject করো।</p>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total",    value: stats.total,    color: "#a78bfa" },
            { label: "Pending",  value: stats.pending,  color: "#fbbf24" },
            { label: "Approved", value: stats.approved, color: "#34d399" },
            { label: "Rejected", value: stats.rejected, color: "#f87171" },
            { label: "Revoked",  value: stats.revoked,  color: "#cbd5e1" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-800 p-4 text-center" style={{ background: "#111827" }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-gray-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {["pending", "approved", "rejected", "revoked"].map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === s ? "text-white" : "text-gray-400 hover:text-gray-300 bg-gray-900 border border-gray-800"
              }`}
              style={tab === s ? { background: "linear-gradient(90deg,#7c3aed,#db2777)" } : {}}
            >
              {s} ({stats[s] ?? 0})
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-gray-500 text-center py-16">লোড হচ্ছে...</div>
        ) : enrollments.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500">কোনো {tab} enrollment নেই।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <EnrollmentRow
                key={e._id}
                enrollment={e}
                onApprove={() => openActionModal(e, "approve")}
                onReject={() => openActionModal(e, "reject")}
                onRevoke={() => openActionModal(e, "revoke")}
                onDelete={() => handleDelete(e._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setActionModal(null)}>
          <div
            className={`w-full ${actionModal.action === "revoke" ? "max-w-md max-h-[85vh] overflow-y-auto" : "max-w-sm"} rounded-2xl border border-purple-800 p-6`}
            style={{ background: "#0d011f" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-1">
              {actionModal.action === "approve" ? "✅ Approve করবে?"
                : actionModal.action === "reject" ? "❌ Reject করবে?"
                : "🚫 Access Revoke করবে?"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {actionModal.enrollment.user?.name} — {actionModal.enrollment.course?.title}
            </p>

            {actionModal.action === "revoke" && (
              <div className="rounded-xl border p-3.5 mb-4 text-xs"
                style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.25)" }}>
                <p className="text-purple-300 font-semibold mb-2">💰 Refund করার জন্য payment details</p>
                {loadingPayment ? (
                  <p className="text-gray-500">লোড হচ্ছে...</p>
                ) : !paymentDetails ? (
                  <p className="text-gray-500">Payment details পাওয়া যায়নি।</p>
                ) : (
                  <div className="space-y-1.5 text-gray-300">
                    <p><span className="text-gray-500">Method:</span> {paymentDetails.walletOrCardType}</p>
                    <p><span className="text-gray-500">Account/Card Number:</span> <span className="font-mono">{paymentDetails.accountNumber}</span></p>
                    <p><span className="text-gray-500">Transaction ID:</span> <span className="font-mono">{paymentDetails.transactionId}</span></p>
                    {paymentDetails.bankTransactionId && (
                      <p><span className="text-gray-500">Bank Tran ID:</span> <span className="font-mono">{paymentDetails.bankTransactionId}</span></p>
                    )}
                    <p><span className="text-gray-500">Amount:</span> ৳{paymentDetails.amount}</p>
                    {paymentDetails.studentContact?.phone && (
                      <p><span className="text-gray-500">Student Phone:</span> {paymentDetails.studentContact.phone}</p>
                    )}
                    <p><span className="text-gray-500">Student Email:</span> {paymentDetails.studentContact?.email}</p>
                    {paymentDetails.screenshotUrl && (
                      <a href={paymentDetails.screenshotUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline block mt-1">
                        Payment Screenshot দেখো
                      </a>
                    )}
                    <p className="text-gray-500 italic mt-2">{paymentDetails.note}</p>
                  </div>
                )}
              </div>
            )}

            <label className="block text-gray-300 text-sm mb-2">
              {actionModal.action === "revoke" ? "কারণ" : "Admin Note"} <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={
                actionModal.action === "reject" ? "reject-এর কারণ জানাও..."
                : actionModal.action === "revoke" ? "revoke করার কারণ (যেমন: refund request, policy violation)..."
                : "কোনো বার্তা (optional)..."
              }
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full rounded-xl border border-purple-800 bg-transparent text-white px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 mb-3 resize-none"
              style={{ background: "#150a2e" }}
            />

            {actionModal.action === "revoke" && (
              <label className="flex items-center gap-2 text-gray-300 text-sm mb-5 cursor-pointer">
                <input type="checkbox" checked={markRefunded} onChange={(e) => setMarkRefunded(e.target.checked)}
                  className="accent-purple-500 w-4 h-4" />
                টাকা refund করা হয়ে গেছে (record রাখার জন্য) — আসল refund তুমি bank/bKash/SSLCommerz panel থেকে manually করবে
              </label>
            )}
            {actionModal.action !== "revoke" && <div className="mb-5" />}

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleReview}
                disabled={processing}
                className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60"
                style={{
                  background: actionModal.action === "approve"
                    ? "linear-gradient(90deg,#059669,#10b981)"
                    : actionModal.action === "revoke"
                    ? "linear-gradient(90deg,#4b5563,#6b7280)"
                    : "linear-gradient(90deg,#dc2626,#ef4444)",
                }}
              >
                {processing ? "Processing..."
                  : actionModal.action === "approve" ? "Approve করো"
                  : actionModal.action === "revoke" ? "Revoke করো"
                  : "Reject করো"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const EnrollmentRow = ({ enrollment, onApprove, onReject, onRevoke, onDelete }) => {
  const { user, course, paymentMethod, transactionId, amountPaid, couponCode, status, screenshotUrl, createdAt, adminNote, revokeReason, refundStatus } = enrollment;
  const sc = STATUS_COLORS[status];

  return (
    <div
      className="rounded-xl border border-gray-800 p-4"
      style={{ background: "#111827" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* User + course info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{user?.name || "User"}</span>
            <span className="text-gray-500 text-xs">{user?.email}</span>
          </div>
          <p className="text-purple-300 text-sm mb-3 leading-snug">{course?.title || "Course"}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <Cell label="Method" value={paymentMethod} />
            <Cell label="TxID" value={transactionId} mono />
            <Cell label="Amount" value={`৳${amountPaid}`} />
            {couponCode && <Cell label="Coupon" value={couponCode} />}
            <Cell label="Date" value={new Date(createdAt).toLocaleDateString("bn-BD")} />
          </div>

          {adminNote && (
            <p className="text-xs mt-2" style={{ color: status === "rejected" ? "#f87171" : "#a3a3a3" }}>
              Note: {adminNote}
            </p>
          )}
          {status === "revoked" && (
            <div className="text-xs mt-2 space-y-0.5">
              {revokeReason && <p style={{ color: "#cbd5e1" }}>কারণ: {revokeReason}</p>}
              <p style={{ color: refundStatus === "refunded" ? "#4ade80" : "#9ca3af" }}>
                Refund: {refundStatus === "refunded" ? "✓ করা হয়েছে" : "করা হয়নি"}
              </p>
            </div>
          )}
        </div>

        {/* Screenshot */}
        {screenshotUrl && (
          <a href={screenshotUrl} target="_blank" rel="noreferrer">
            <img src={screenshotUrl} alt="screenshot" className="w-20 h-20 object-cover rounded-lg border border-purple-800 hover:opacity-80 transition-opacity" />
          </a>
        )}

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {status}
          </span>

          {status === "pending" && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={onApprove}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(90deg,#059669,#10b981)" }}
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(90deg,#dc2626,#ef4444)" }}
              >
                Reject
              </button>
            </div>
          )}

          {status === "approved" && (
            <button
              onClick={onRevoke}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:scale-105 mt-1"
              style={{ background: "linear-gradient(90deg,#4b5563,#6b7280)" }}
            >
              🚫 Revoke Access
            </button>
          )}

          <button
            onClick={onDelete}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors mt-1"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Cell = ({ label, value, mono }) => (
  <div>
    <span className="text-gray-500">{label}: </span>
    <span className={`text-gray-300 ${mono ? "font-mono" : ""}`}>{value}</span>
  </div>
);

export default AdminEnrollments;
