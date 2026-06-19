import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiCheckCircle, FiClock, FiXCircle, FiSend } from "react-icons/fi";

const InstructorRequestPage = () => {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/users/my-request")
      .then((r) => setRequest(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!reason.trim()) return toast.error("Please write a reason");
    setSubmitting(true);
    try {
      const { data } = await api.post("/users/request-instructor", { reason });
      toast.success("Request submitted! Admin will review soon.");
      setRequest(data.request);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { icon: <FiClock />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", label: "Pending Review" },
    approved: { icon: <FiCheckCircle />, color: "text-green-400 bg-green-500/10 border-green-500/20", label: "Approved! 🎉" },
    rejected: { icon: <FiXCircle />, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Rejected" },
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Become an Instructor</h2>
        <p className="text-gray-400 mb-8">Submit a request to become an instructor and start creating content.</p>

        {loading ? (
          <div className="h-40 bg-gray-800 rounded-xl animate-pulse" />
        ) : request ? (
          <div className={`border rounded-xl p-6 ${statusConfig[request.status]?.color}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">{statusConfig[request.status]?.icon}</span>
              <span className="font-bold text-lg">{statusConfig[request.status]?.label}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Your reason: </span>
                <span className="text-gray-300">{request.reason || "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">Submitted: </span>
                <span className="text-gray-300">
                  {new Date(request.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              {request.adminNote && (
                <div>
                  <span className="text-gray-500">Admin note: </span>
                  <span className="text-gray-300">{request.adminNote}</span>
                </div>
              )}
              {request.reviewedBy && (
                <div>
                  <span className="text-gray-500">Reviewed by: </span>
                  <span className="text-gray-300">{request.reviewedBy.name}</span>
                </div>
              )}
            </div>

            {request.status === "approved" && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg text-green-300 text-sm">
                🎉 Congratulations! Please log out and log back in to access your Instructor dashboard.
              </div>
            )}

            {request.status === "rejected" && (
              <button
                onClick={() => setRequest(null)}
                className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 underline"
              >
                Submit a new request
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Why do you want to become an instructor?
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Tell us about your expertise, experience, and what you'd like to teach..."
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none mb-4"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <FiSend size={16} /> {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorRequestPage;
