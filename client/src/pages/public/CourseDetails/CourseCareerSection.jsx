import { useEffect, useState } from "react";
import api from "../../../utils/api";

// ── FALLBACKS ─────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  heading:      "কোর্স শেষে তোমার ক্যারিয়ার 🚀",
  subtitle:     "আমাদের ৫০০+ গ্র্যাজুয়েট দেশে এবং বিদেশে সফলভাবে কাজ করছে। চাকরি, ফ্রিল্যান্সিং বা নিজের স্টার্টআপ — যেকোনো পথে প্রস্তুত করব।",
  displayStyle: "split",
};
const DEFAULT_BULLETS = [
  { _id: "b1", icon: "🏢", text: "Top Tech Company তে জব পাওয়ার সুযোগ" },
  { _id: "b2", icon: "💻", text: "Upwork, Fiverr এ Freelancing শুরু" },
  { _id: "b3", icon: "📁", text: "শক্তিশালী GitHub Portfolio তৈরি" },
];
const DEFAULT_STATS = [
  { _id: "s1", icon: "🎓", value: "৫০০+", label: "সফল গ্র্যাজুয়েট",  colorFrom: "#7c3aed", colorTo: "#6d28d9" },
  { _id: "s2", icon: "💼", value: "৮৫%",  label: "জব পেয়েছে",         colorFrom: "#db2777", colorTo: "#be185d" },
  { _id: "s3", icon: "📈", value: "৩x",   label: "স্যালারি বৃদ্ধি",   colorFrom: "#4f46e5", colorTo: "#4338ca" },
  { _id: "s4", icon: "🤝", value: "৬০+",  label: "হায়ারিং পার্টনার", colorFrom: "#0891b2", colorTo: "#0e7490" },
];

// ── Design 1: Split (left bullets + right stat grid) ─────────────────────
const SplitView = ({ settings, bullets, stats }) => (
  <div className="grid lg:grid-cols-2 gap-12 items-center">
    {/* Left — bullets */}
    <div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
        {settings.heading}
      </h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">{settings.subtitle}</p>
      <div className="space-y-3">
        {bullets.map((b) => (
          <p key={b._id} className="text-gray-300 text-sm flex items-center gap-2">
            <span>{b.icon}</span> {b.text}
          </p>
        ))}
      </div>
    </div>

    {/* Right — stat cards */}
    <div className="grid grid-cols-2 gap-4">
      {stats.map((s) => (
        <div
          key={s._id}
          className="rounded-2xl p-6 text-center"
          style={{ background: `linear-gradient(135deg, ${s.colorFrom}, ${s.colorTo})` }}
        >
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
          <div className="text-white text-xs opacity-80">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Design 2: Cards (3 horizontal feature cards) ──────────────────────────
const CardsView = ({ settings, bullets, stats }) => (
  <div>
    <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
      {settings.heading}
    </h2>
    <p className="text-gray-400 text-center text-sm mb-10 max-w-2xl mx-auto leading-relaxed">
      {settings.subtitle}
    </p>

    {/* Bullet feature cards */}
    <div className="grid sm:grid-cols-3 gap-5 mb-8">
      {bullets.map((b) => (
        <div
          key={b._id}
          className="rounded-2xl p-6 border border-purple-800 hover:border-purple-500 transition-all text-center group"
          style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">
            {b.icon}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{b.text}</p>
        </div>
      ))}
    </div>

    {/* Stat strip */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s._id}
          className="rounded-xl p-4 text-center"
          style={{ background: `linear-gradient(135deg, ${s.colorFrom}33, ${s.colorTo}33)`, border: `1px solid ${s.colorFrom}55` }}
        >
          <div className="text-xl mb-1">{s.icon}</div>
          <div className="text-2xl font-extrabold text-white mb-0.5">{s.value}</div>
          <div className="text-gray-400 text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────
const CourseCareerSection = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [bullets,  setBullets]  = useState(DEFAULT_BULLETS);
  const [stats,    setStats]    = useState(DEFAULT_STATS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/course-career")
      .then((res) => {
        setSettings(res.data.settings || DEFAULT_SETTINGS);
        setBullets(res.data.bullets?.length  ? res.data.bullets  : DEFAULT_BULLETS);
        setStats(res.data.stats?.length      ? res.data.stats    : DEFAULT_STATS);
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
        setBullets(DEFAULT_BULLETS);
        setStats(DEFAULT_STATS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section style={{ background: "#0d011f" }} className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-gray-800/50 rounded animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "#0d011f" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {settings.displayStyle === "cards"
          ? <CardsView settings={settings} bullets={bullets} stats={stats} />
          : <SplitView settings={settings} bullets={bullets} stats={stats} />
        }
      </div>
    </section>
  );
};

export default CourseCareerSection;
