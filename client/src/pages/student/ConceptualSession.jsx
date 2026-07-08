import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { FiVideo, FiGlobe, FiBookOpen, FiClock, FiCalendar, FiCopy } from "react-icons/fi";
import toast from "react-hot-toast";

const platformBadge = (p) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${p === "zoom" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
    <FiVideo size={11} /> {p === "zoom" ? "Zoom" : "Google Meet"}
  </span>
);

// Session-এর বর্তমান অবস্থা বের করে: upcoming (join korte pare kina soho) | live | ended | cancelled
const getSessionState = (s) => {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "completed") return "ended";

  const now = new Date();
  const start = new Date(s.startTime);
  const end = new Date(start.getTime() + s.durationMinutes * 60000);
  const joinWindowStart = new Date(start.getTime() - 10 * 60000); // ১০ মিনিট আগে থেকে join button চালু

  if (now > end) return "ended";
  if (now >= start && now <= end) return "live";
  if (now >= joinWindowStart && now < start) return "joinable-soon"; // join button on, but session hoyni
  return "upcoming";
};

const timeUntil = (startTime) => {
  const diffMs = new Date(startTime) - new Date();
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return `${days} দিন ${hours} ঘণ্টা পরে`;
  if (hours > 0) return `${hours} ঘণ্টা ${remMins} মিনিট পরে`;
  return `${remMins} মিনিট পরে`;
};

const SessionCard = ({ s }) => {
  const state = getSessionState(s);
  const copyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(s.meetingLink);
    toast.success("লিংক কপি হয়েছে!");
  };

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${state === "live" ? "border-green-600/50" : "border-gray-800"}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${s.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
          {s.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
          {s.scope === "global" ? "সাধারণ সেশন" : s.course?.title || "কোর্স"}
        </span>
        {platformBadge(s.platform)}
        {state === "live" && <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 animate-pulse">🔴 লাইভ এখন</span>}
        {state === "ended" && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-400">শেষ হয়েছে</span>}
        {state === "cancelled" && <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">বাতিল হয়েছে</span>}
      </div>

      <h3 className="text-white font-semibold mb-1">{s.title}</h3>
      {s.description && <p className="text-gray-400 text-sm mb-3">{s.description}</p>}

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><FiCalendar size={11} /> {new Date(s.startTime).toLocaleString("bn-BD")}</span>
        <span className="flex items-center gap-1"><FiClock size={11} /> {s.durationMinutes} মিনিট</span>
        <span>{s.createdBy?.name} {s.createdByRole === "admin" ? "(অ্যাডমিন)" : "(ইন্সট্রাক্টর)"}</span>
      </div>

      {(s.meetingId || s.passcode) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
          {s.meetingId && <span>Meeting ID: <span className="text-gray-300">{s.meetingId}</span></span>}
          {s.passcode && <span>Passcode: <span className="text-gray-300">{s.passcode}</span></span>}
        </div>
      )}

      {state === "cancelled" ? (
        <div className="text-sm text-red-400">এই সেশনটি বাতিল করা হয়েছে।</div>
      ) : state === "ended" ? (
        <button disabled className="px-4 py-2 rounded-lg bg-gray-800 text-gray-500 text-sm font-medium cursor-not-allowed">
          সেশন শেষ হয়ে গেছে
        </button>
      ) : state === "live" || state === "joinable-soon" ? (
        <div className="flex items-center gap-2">
          <a
            href={s.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-bold transition-colors"
          >
            এখনই জয়েন করো →
          </a>
          <button onClick={copyLink} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="লিংক কপি করো">
            <FiCopy size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button disabled className="px-4 py-2 rounded-lg bg-gray-800 text-gray-500 text-sm font-medium cursor-not-allowed">
            {timeUntil(s.startTime) || "শীঘ্রই শুরু হবে"}
          </button>
          <button onClick={copyLink} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="লিংক কপি করো">
            <FiCopy size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

const ConceptualSession = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/sessions/feed")
      .then((res) => { if (mounted) setSessions(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const live = sessions.filter((s) => getSessionState(s) === "live");
  const upcoming = sessions.filter((s) => ["upcoming", "joinable-soon"].includes(getSessionState(s)));
  const past = sessions.filter((s) => ["ended", "cancelled"].includes(getSessionState(s)));

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Conceptual Session</h1>
        <p className="text-gray-400 mb-8">Live doubt-clearing সেশন — Zoom/Google Meet এ জয়েন করো</p>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">💡</p>
            <p className="text-white font-semibold mb-2">কোনো সেশন নেই</p>
            <p className="text-gray-500 text-sm">নতুন কোনো সেশন শিডিউল হলে এখানে দেখতে পাবে।</p>
          </div>
        ) : (
          <div className="space-y-8">
            {live.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">🔴 লাইভ এখন</h2>
                <div className="space-y-3">{live.map((s) => <SessionCard key={s._id} s={s} />)}</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 mb-3">আসন্ন সেশন</h2>
                <div className="space-y-3">{upcoming.map((s) => <SessionCard key={s._id} s={s} />)}</div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">পূর্ববর্তী সেশন</h2>
                <div className="space-y-3">{past.map((s) => <SessionCard key={s._id} s={s} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConceptualSession;
