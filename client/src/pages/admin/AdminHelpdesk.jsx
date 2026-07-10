import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiX, FiSend, FiTrash2, FiFilter } from "react-icons/fi";

const CATEGORY_LABEL = {
  technical: "টেকনিক্যাল",
  billing: "পেমেন্ট / বিলিং",
  course: "কোর্স সংক্রান্ত",
  account: "অ্যাকাউন্ট",
  other: "অন্যান্য",
};

const STATUS_STYLE = {
  open:        { label: "Open",        cls: "bg-blue-500/10 text-blue-400" },
  in_progress: { label: "In Progress", cls: "bg-yellow-500/10 text-yellow-400" },
  resolved:    { label: "Resolved",    cls: "bg-green-500/10 text-green-400" },
  closed:      { label: "Closed",      cls: "bg-gray-700/50 text-gray-400" },
};

const PRIORITY_STYLE = {
  low:    "text-gray-400",
  normal: "text-gray-300",
  high:   "text-red-400 font-semibold",
};

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

// ── Ticket thread modal — admin view + reply + status change ─────────────
const TicketModal = ({ ticketId, onClose, onChanged }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    api.get(`/admin/helpdesk/tickets/${ticketId}`)
      .then(({ data }) => setTicket(data))
      .catch(() => toast.error("Ticket load করা যায়নি"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [ticketId]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/admin/helpdesk/tickets/${ticketId}/reply`, { message: reply.trim() });
      setTicket(data);
      setReply("");
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reply পাঠানো যায়নি");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      const { data } = await api.put(`/admin/helpdesk/tickets/${ticketId}/status`, { status });
      setTicket((prev) => ({ ...prev, status: data.status }));
      toast.success("Status update হয়েছে");
      onChanged?.();
    } catch {
      toast.error("Status update করা যায়নি");
    }
  };

  const remove = async () => {
    if (!confirm("এই ticket টা পুরোপুরি delete করে দিতে চাও?")) return;
    try {
      await api.delete(`/admin/helpdesk/tickets/${ticketId}`);
      toast.success("Ticket delete হয়েছে");
      onChanged?.();
      onClose();
    } catch {
      toast.error("Delete করা যায়নি");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-6 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {loading || !ticket ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <p className="text-white font-bold text-lg">{ticket.subject}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {ticket.user?.name} ({ticket.user?.email}) • {CATEGORY_LABEL[ticket.category]} •{" "}
                  <span className={PRIORITY_STYLE[ticket.priority]}>{ticket.priority} priority</span>
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0"><FiX size={20} /></button>
            </div>

            <div className="flex items-center gap-2 my-3">
              {Object.entries(STATUS_STYLE).map(([k, s]) => (
                <button key={k} onClick={() => changeStatus(k)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${ticket.status === k ? s.cls + " ring-1 ring-current" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}>
                  {s.label}
                </button>
              ))}
              <button onClick={remove} className="ml-auto text-gray-500 hover:text-red-400" title="Delete ticket">
                <FiTrash2 size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 mt-2">
              <div className="bg-gray-800/60 rounded-xl p-3.5">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{ticket.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {ticket.user?.name} • {new Date(ticket.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>

              {ticket.replies?.map((r) => {
                const isAdmin = r.senderRole !== "user";
                return (
                  <div key={r._id} className={`rounded-xl p-3.5 ${isAdmin ? "bg-purple-500/10 ml-6" : "bg-cyan-500/10 mr-6"}`}>
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">{r.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {isAdmin ? `তুমি (${r.senderRole})` : r.sender?.name} • {new Date(r.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-end gap-2">
              <textarea className={inputCls + " resize-none"} rows={2} placeholder="Reply লিখো..."
                value={reply} onChange={(e) => setReply(e.target.value)} />
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 p-3 rounded-xl transition-colors shrink-0">
                <FiSend size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AdminHelpdesk = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/helpdesk/tickets", { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setTickets(data))
      .catch(() => toast.error("Ticket list load করা যায়নি"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Helpdesk — Support Tickets</h1>
        <p className="text-gray-400 mb-6">Student দের raise করা সব support ticket এখানে দেখো ও reply করো</p>

        <div className="flex items-center gap-2 mb-5">
          <FiFilter className="text-gray-500" size={14} />
          {["", "open", "in_progress", "resolved", "closed"].map((s) => (
            <button key={s || "all"} onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === s ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:text-gray-200"
              }`}>
              {s ? STATUS_STYLE[s].label : "সব"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🎧</p>
            <p className="text-white font-semibold mb-2">কোনো ticket নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <button key={t._id} onClick={() => setOpenId(t._id)}
                className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-cyan-700/50 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[t.status].cls}`}>
                    {STATUS_STYLE[t.status].label}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-800 text-gray-400">
                    {CATEGORY_LABEL[t.category]}
                  </span>
                  <span className={`text-xs ${PRIORITY_STYLE[t.priority]}`}>{t.priority} priority</span>
                </div>
                <h3 className="font-semibold text-white mb-1">{t.subject}</h3>
                <p className="text-gray-500 text-sm truncate">{t.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {t.user?.name} ({t.user?.email}) • শেষ আপডেট: {new Date(t.lastReplyAt).toLocaleString("bn-BD")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {openId && (
        <TicketModal ticketId={openId} onClose={() => { setOpenId(null); load(); }} onChanged={load} />
      )}
    </DashboardLayout>
  );
};

export default AdminHelpdesk;
