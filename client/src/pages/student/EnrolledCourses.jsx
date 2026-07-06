// client/src/pages/student/EnrolledCourses.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const STATUS_BADGE = {
  approved: {
    label: "Approved ✅",
    style: {
      background: "rgba(5,150,105,0.15)",
      color: "#34d399",
      border: "1px solid rgba(5,150,105,0.3)",
    },
  },
  pending: {
    label: "Pending ⏳",
    style: {
      background: "rgba(234,179,8,0.1)",
      color: "#fbbf24",
      border: "1px solid rgba(234,179,8,0.3)",
    },
  },
  rejected: {
    label: "Rejected ✗",
    style: {
      background: "rgba(239,68,68,0.1)",
      color: "#f87171",
      border: "1px solid rgba(239,68,68,0.3)",
    },
  },
};

const EnrolledCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("approved");

  useEffect(() => {
    api
      .get("/enrollments/my")
      .then(({ data }) => setEnrollments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) => e.status === tab);
  const counts = {
    approved: enrollments.filter((e) => e.status === "approved").length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    rejected: enrollments.filter((e) => e.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">আমার কোর্সসমূহ</h1>
        <p className="text-gray-400 mb-6">
          তোমার সব enrollment request এখানে দেখতে পাবে।
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "approved", label: `Active (${counts.approved})` },
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "rejected", label: `Rejected (${counts.rejected})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-300 bg-gray-900 border border-gray-800"
              }`}
              style={
                tab === key
                  ? { background: "linear-gradient(90deg,#7c3aed,#db2777)" }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-16">লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-5xl mb-4">
              {tab === "approved" ? "🎓" : tab === "pending" ? "⏳" : "❌"}
            </p>
            <p className="text-white font-semibold mb-2">
              {tab === "approved"
                ? "এখনো কোনো কোর্স নেই"
                : tab === "pending"
                ? "কোনো pending request নেই"
                : "কোনো rejected request নেই"}
            </p>
            {tab === "approved" && (
              <p className="text-gray-500 text-sm">
                Course দেখতে{" "}
                <Link
                  to="/categories"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Categories
                </Link>{" "}
                পেজে যাও।
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <EnrollmentCard key={e._id} enrollment={e} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const EnrollmentCard = ({ enrollment }) => {
  const navigate = useNavigate();
  const {
    course,
    paymentMethod,
    transactionId,
    amountPaid,
    couponCode,
    status,
    createdAt,
    adminNote,
  } = enrollment;
  const badge = STATUS_BADGE[status];

  const handleCardClick = () => {
    if (status === "approved" && course?._id) {
      navigate(`/student/course/${course._id}`);
    }
  };

  return (
    <div
      className={`rounded-xl border border-gray-800 p-4 flex flex-col gap-3 transition-all duration-200 ${
        status === "approved"
          ? "cursor-pointer hover:border-purple-600 hover:scale-[1.02]"
          : ""
      }`}
      style={{ background: "#111827" }}
      onClick={handleCardClick}
    >
      {/* Course thumbnail */}
      {course?.thumbnail ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course?.title}
            className="w-full h-full object-cover"
          />
          {/* Play overlay on approved */}
          {status === "approved" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-full h-36 rounded-lg flex items-center justify-center text-3xl relative"
          style={{ background: "#1f2937" }}
        >
          🎓
          {status === "approved" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 hover:bg-black/30 transition-all duration-200">
              <div className="opacity-0 hover:opacity-100 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course name */}
      <p className="text-white font-semibold text-sm leading-snug">
        {course?.title || "Course"}
      </p>

      {/* Payment info */}
      <div className="space-y-1">
        <Row label="Payment" value={paymentMethod} />
        <Row label="TxID" value={transactionId} mono />
        <Row label="Amount" value={`৳${amountPaid}`} />
        {couponCode && <Row label="Coupon" value={couponCode} />}
        <Row
          label="Request Date"
          value={new Date(createdAt).toLocaleDateString("bn-BD")}
        />
      </div>

      {/* Status badge */}
      <div
        className="text-xs font-medium px-3 py-1.5 rounded-lg text-center w-full"
        style={badge.style}
      >
        {badge.label}
      </div>

      {/* Admin note for rejected */}
      {status === "rejected" && adminNote && (
        <p className="text-xs text-red-300 mt-1">কারণ: {adminNote}</p>
      )}

      {/* Continue learning CTA (approved only) */}
      {status === "approved" && (
        <div
          className="text-white text-xs font-bold py-2.5 rounded-lg text-center"
          style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/student/course/${course?._id}`);
          }}
        >
          ▶ শেখা শুরু করো
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-500 text-xs">{label}</span>
    <span
      className={`text-gray-300 text-xs text-right truncate max-w-[150px] ${
        mono ? "font-mono" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

export default EnrolledCourses;
