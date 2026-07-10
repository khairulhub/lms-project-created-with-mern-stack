import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { FiPlus, FiX, FiSend, FiLock } from "react-icons/fi";

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

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

// ── নতুন ticket খোলার modal ──────────────────────────────────────────────
const NewTicketModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ subject: "", message: "", category: "other", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject আর Message দুইটাই লিখতে হবে");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/helpdesk/tickets", form);
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "কিছু একটা সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">নতুন Support Ticket</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Subject *</label>
            <input className={inputCls} placeholder="যেমন: পেমেন্ট করার পরও enrollment approve হয়নি"
              value={form.subject} onChange={(e) => set("subject", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Priority</label>
              <select className={inputCls} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Message *</label>
            <textarea className={inputCls + " resize-none"} rows={5}
              placeholder="বিস্তারিত লিখো — কী সমস্যা হচ্ছে, কবে থেকে, কী ধরনের সাহায্য লাগবে..."
              value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>
        </div>

        <button onClick={submit} disabled={saving}
          className="mt-5 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold py-2.5 rounded-xl transition-colors text-sm">
          {saving ? "পাঠানো হচ্ছে..." : "Ticket সাবমিট করো"}
        </button>
      </div>
    </div>
  );
};

// ── Ticket thread modal (detail + reply) ─────────────────────────────────
const TicketThread = ({ ticketId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get(`/helpdesk/tickets/${ticketId}`)
      .then(({ data }) => setTicket(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [ticketId]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/helpdesk/tickets/${ticketId}/reply`, { message: reply.trim() });
      setTicket(data);
      setReply("");
      onUpdated?.(data);
    } catch (err) {
      alert(err.response?.data?.message || "Reply পাঠানো যায়নি");
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!confirm("এই ticket টা close করে দিতে চাও? পরে আবার message পাঠাতে পারবে না।")) return;
    await api.put(`/helpdesk/tickets/${ticketId}/close`);
    load();
    onUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {loading || !ticket ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[ticket.status].cls}`}>
                  {STATUS_STYLE[ticket.status].label}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-800 text-gray-400">
                  {CATEGORY_LABEL[ticket.category]}
                </span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0"><FiX size={20} /></button>
            </div>

            <h3 className="text-white font-bold text-lg mt-2 mb-4">{ticket.subject}</h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
              {/* original message */}
              <div className="bg-gray-800/60 rounded-xl p-3.5">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{ticket.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {ticket.user?.name} • {new Date(ticket.createdAt).toLocaleString("bn-BD")}
                </p>
              </div>

              {ticket.replies?.map((r) => {
                const mine = r.senderRole === "user";
                return (
                  <div key={r._id} className={`rounded-xl p-3.5 ${mine ? "bg-cyan-500/10 ml-6" : "bg-purple-500/10 mr-6"}`}>
                    <p className="text-gray-200 text-sm whitespace-pre-wrap">{r.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {mine ? "তুমি" : `${r.sender?.name || "Support"} (${r.senderRole === "admin" ? "Admin" : "Instructor"})`} • {new Date(r.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                );
              })}
            </div>

            {ticket.status === "closed" ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-800/50 rounded-xl p-3">
                <FiLock size={14} /> এই ticket টা closed — নতুন সমস্যা হলে নতুন ticket খোলো।
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea className={inputCls + " resize-none"} rows={2} placeholder="তোমার reply লিখো..."
                  value={reply} onChange={(e) => setReply(e.target.value)} />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 p-3 rounded-xl transition-colors shrink-0">
                  <FiSend size={16} />
                </button>
              </div>
            )}

            {ticket.status !== "closed" && (
              <button onClick={closeTicket} className="text-gray-500 hover:text-red-400 text-xs mt-3 self-start">
                এই ticket টা close করে দাও
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Helpdesk = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [openTicketId, setOpenTicketId] = useState(null);

  const loadTickets = () => {
    api.get("/helpdesk/tickets/my")
      .then(({ data }) => setTickets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Helpdesk</h1>
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-xl transition-colors text-sm">
            <FiPlus size={16} /> নতুন Ticket
          </button>
        </div>
        <p className="text-gray-400 mb-8">Get support and raise tickets</p>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🎧</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো ticket খোলা হয়নি</p>
            <p className="text-gray-500 text-sm mb-6">কোনো সমস্যা হলে "নতুন Ticket" বাটনে ক্লিক করে জানাও</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <button key={t._id} onClick={() => setOpenTicketId(t._id)}
                className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-cyan-700/50 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[t.status].cls}`}>
                    {STATUS_STYLE[t.status].label}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-800 text-gray-400">
                    {CATEGORY_LABEL[t.category]}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-1">{t.subject}</h3>
                <p className="text-gray-500 text-sm truncate">{t.message}</p>
                <p className="text-gray-500 text-xs mt-2">
                  শেষ আপডেট: {new Date(t.lastReplyAt).toLocaleString("bn-BD")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={(t) => { setShowNew(false); setTickets((prev) => [t, ...prev]); }}
        />
      )}

      {openTicketId && (
        <TicketThread
          ticketId={openTicketId}
          onClose={() => { setOpenTicketId(null); loadTickets(); }}
          onUpdated={loadTickets}
        />
      )}
    </DashboardLayout>
  );
};

export default Helpdesk;
