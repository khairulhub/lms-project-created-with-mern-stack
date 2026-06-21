import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

const statusConfig = {
  pending: { icon: <FiClock />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  approved: { icon: <FiCheckCircle />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  rejected: { icon: <FiXCircle />, color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

const AdminInstructorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [noteInput, setNoteInput] = useState({});
  const [processing, setProcessing] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    api.get("/admin/instructor-requests").then((r) => setRequests(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async (id, action) => {
    setProcessing(id + action);
    try {
      await api.put(`/admin/instructor-requests/${id}`, { action, adminNote: noteInput[id] || "" });
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally { setProcessing(null); }
  };

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Instructor Requests</h2>
          <p className="text-gray-400 text-sm">{pendingCount} pending review</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}>
              {f} {f === "pending" && pendingCount > 0 && <span className="ml-1 bg-yellow-500 text-gray-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FiCheckCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>No {filter} requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <img src={req.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user?.email}`}
                      className="w-10 h-10 rounded-full bg-gray-700" alt={req.user?.name} />
                    <div>
                      <p className="text-white font-semibold">{req.user?.name}</p>
                      <p className="text-gray-400 text-sm">{req.user?.email}</p>
                      {req.user?.designation && <p className="text-gray-500 text-xs">{req.user.designation}</p>}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${statusConfig[req.status]?.color}`}>
                    {statusConfig[req.status]?.icon} {req.status}
                  </span>
                </div>

                {req.reason && (
                  <div className="mt-4 bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Reason from user:</p>
                    <p className="text-gray-300 text-sm">{req.reason}</p>
                  </div>
                )}

                {req.status === "pending" && (
                  <div className="mt-4 space-y-3">
                    <input
                      value={noteInput[req._id] || ""}
                      onChange={(e) => setNoteInput({ ...noteInput, [req._id]: e.target.value })}
                      placeholder="Optional note to user..."
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(req._id, "approve")}
                        disabled={processing === req._id + "approve"}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm">
                        <FiCheckCircle size={15} /> {processing === req._id + "approve" ? "Approving..." : "Approve"}
                      </button>
                      <button onClick={() => handleReview(req._id, "reject")}
                        disabled={processing === req._id + "reject"}
                        className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm">
                        <FiXCircle size={15} /> {processing === req._id + "reject" ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {req.status !== "pending" && (
                  <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
                    {req.adminNote && <span>Note: <span className="text-gray-400">{req.adminNote}</span></span>}
                    {req.reviewedBy && <span>By: <span className="text-gray-400">{req.reviewedBy.name}</span></span>}
                    {req.reviewedAt && <span>{new Date(req.reviewedAt).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminInstructorRequests;
