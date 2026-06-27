import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiStar, FiTrash2, FiArrowLeft, FiClock,
  FiEye, FiEyeOff, FiFilter, FiX, FiUser, FiMessageSquare,
} from "react-icons/fi";

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <FiStar key={s} size={12}
        className={s <= rating ? "text-yellow-400" : "text-gray-600"}
        style={{ fill: s <= rating ? "#facc15" : "none" }} />
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    active:   "bg-green-500/10  text-green-400  border-green-500/30",
    rejected: "bg-red-500/10   text-red-400    border-red-500/30",
  };
  const label = { pending: "Pending", active: "Active", rejected: "Rejected" };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${map[status] || map.pending}`}>
      {label[status] || status}
    </span>
  );
};

// ── Instructor list ───────────────────────────────────────────────────────────
const InstructorList = ({ onSelect }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get("/admin/student-reviews/instructors")
      .then((r) => setInstructors(r.data))
      .catch(() => toast.error("Load failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!instructors.length) return (
    <div className="text-center py-16 text-gray-500">
      <FiMessageSquare size={36} className="mx-auto mb-3 opacity-30" />
      <p>এখনো কোনো instructor কে review দেওয়া হয়নি।</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {instructors.map((inst) => (
        <button key={inst._id} onClick={() => onSelect(inst)}
          className="w-full bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors text-left">
          <img
            src={inst.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.email}`}
            className="w-10 h-10 rounded-full shrink-0 bg-gray-800" alt={inst.name} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{inst.name}</p>
            <p className="text-gray-500 text-xs">{inst.designation || inst.role}</p>
            <div className="flex gap-4 mt-1 text-xs">
              <span className="text-gray-500">{inst.counts.total} মোট</span>
              <span className="text-yellow-400">{inst.counts.pending} pending</span>
              <span className="text-green-400">{inst.counts.active} active</span>
            </div>
          </div>
          {inst.counts.pending > 0 && (
            <span className="shrink-0 bg-yellow-500 text-gray-950 text-xs font-bold px-2.5 py-1 rounded-full">
              {inst.counts.pending} নতুন
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ── Review list for a specific instructor ─────────────────────────────────────
const InstructorReviewList = ({ instructor, onBack }) => {
  const [data,    setData]    = useState({ instructor: null, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [working, setWorking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/student-reviews/instructor/${instructor._id}`);
      setData(r.data);
    } catch { toast.error("Load failed"); }
    finally { setLoading(false); }
  }, [instructor._id]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (review, status) => {
    setWorking(review._id);
    try {
      await api.put(`/admin/student-reviews/instructor-review/${review._id}`, { status });
      toast.success(status === "active" ? "✅ Active" : status === "rejected" ? "❌ Rejected" : "Updated");
      load();
    } catch { toast.error("Update failed"); }
    finally { setWorking(null); }
  };

  const deleteReview = async (review) => {
    if (!window.confirm(`"${review.name}" এর review delete করবে?`)) return;
    setWorking(review._id);
    try {
      await api.delete(`/admin/student-reviews/instructor-review/${review._id}`);
      toast.success("Deleted");
      load();
    } catch { toast.error("Delete failed"); }
    finally { setWorking(null); }
  };

  const inst      = data.instructor || instructor;
  const filters   = ["all","pending","active","rejected"];
  const counts    = {
    all:      data.reviews.length,
    pending:  data.reviews.filter((r) => r.status === "pending").length,
    active:   data.reviews.filter((r) => r.status === "active").length,
    rejected: data.reviews.filter((r) => r.status === "rejected").length,
  };
  const visible = filter === "all" ? data.reviews : data.reviews.filter((r) => r.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          <FiArrowLeft size={16} />
        </button>
        <img
          src={inst.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.email}`}
          className="w-10 h-10 rounded-full bg-gray-800" alt={inst.name} />
        <div>
          <h2 className="text-white font-bold text-lg">{inst.name}</h2>
          <p className="text-gray-400 text-sm">{inst.designation || inst.role} · Instructor Reviews</p>
        </div>
      </div>

      {/* Instructor info card */}
      {inst.bio && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
          <FiUser size={14} className="text-purple-400 mt-0.5 shrink-0" />
          <p className="text-gray-400 text-sm leading-relaxed">{inst.bio}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}>
            <FiFilter size={11} />
            {f === "all" ? "সব" : f === "pending" ? "Pending" : f === "active" ? "Active" : "Rejected"}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${filter === f ? "bg-gray-950/30" : "bg-gray-700"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-gray-500">কোনো review নেই।</div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r._id}
              className={`bg-gray-900 border rounded-xl px-5 py-4 transition-opacity ${
                r.status === "rejected" ? "border-red-900/40 opacity-60" :
                r.status === "active"   ? "border-green-900/40" : "border-gray-800"
              }`}>
              <div className="flex items-start gap-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`}
                  className="w-10 h-10 rounded-full shrink-0 bg-gray-800" alt={r.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    {r.email && <p className="text-gray-500 text-xs">{r.email}</p>}
                    <StarDisplay rating={r.rating} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{r.text}</p>
                  <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                    <FiClock size={10} />
                    {new Date(r.createdAt).toLocaleString("bn-BD")}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status !== "active" && (
                    <button disabled={working === r._id} onClick={() => setStatus(r, "active")}
                      className="flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <FiEye size={12} /> Active
                    </button>
                  )}
                  {r.status === "active" && (
                    <button disabled={working === r._id} onClick={() => setStatus(r, "pending")}
                      className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <FiEyeOff size={12} /> Inactive
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button disabled={working === r._id} onClick={() => setStatus(r, "rejected")}
                      className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <FiX size={12} /> Reject
                    </button>
                  )}
                  <button disabled={working === r._id} onClick={() => deleteReview(r)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminInstructorReviews = () => {
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Instructor Review</h2>
        <p className="text-gray-400 text-sm">
          Student-submitted instructor reviews — approve করলে public page এ দেখাবে।
        </p>
      </div>

      {selectedInstructor ? (
        <InstructorReviewList
          instructor={selectedInstructor}
          onBack={() => setSelectedInstructor(null)}
        />
      ) : (
        <InstructorList onSelect={setSelectedInstructor} />
      )}
    </DashboardLayout>
  );
};

export default AdminInstructorReviews;
