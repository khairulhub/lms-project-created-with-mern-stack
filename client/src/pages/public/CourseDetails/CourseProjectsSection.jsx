import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api from "../../../utils/api";

// ── FALLBACK ─────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  heading:      "বাস্তব প্রজেক্ট বানাবে",
  subtitle:     "শুধু থিওরি না — real-world project যা portfolio তে রাখতে পারবে",
  displayStyle: "grid",
};

const DEFAULT_PROJECTS = [
  { _id: "d1", emoji: "🛒", title: "E-Commerce Platform",   techTags: ["React", "Node.js", "MongoDB"],      description: "পূর্ণ ফিচারযুক্ত ই-কমার্স অ্যাপ — product listing, cart, payment, admin panel" },
  { _id: "d2", emoji: "📚", title: "LMS Platform",           techTags: ["React", "Firebase", "Express"],    description: "Course management system, video player, quiz system সহ" },
  { _id: "d3", emoji: "💬", title: "Real-time Chat App",     techTags: ["Socket.io", "React", "Node"],      description: "Real-time messaging, group chat, online status" },
  { _id: "d4", emoji: "🏠", title: "Property Listing Site",  techTags: ["React", "MongoDB", "JWT"],         description: "Property search, filter, booking এবং review system" },
];

// ── Shared Project Card ───────────────────────────────────────────────────
const ProjectCard = ({ project }) => (
  <div
    className="rounded-2xl p-6 border border-purple-800 hover:border-purple-500 transition-all group h-full flex flex-col"
    style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}
  >
    <div className="text-4xl mb-4">{project.emoji}</div>
    <h3 className="text-white font-bold text-base mb-2 group-hover:text-purple-300 transition-colors">
      {project.title}
    </h3>
    <p className="text-gray-400 text-sm mb-4 leading-relaxed flex-1">{project.description}</p>
    <div className="flex flex-wrap gap-2">
      {(project.techTags || []).map((t) => (
        <span
          key={t}
          className="text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-700"
          style={{ background: "rgba(124,58,237,0.15)" }}
        >
          {t}
        </span>
      ))}
    </div>
  </div>
);

// ── Grid Layout ───────────────────────────────────────────────────────────
const GridView = ({ projects }) => (
  <div className="grid sm:grid-cols-2 gap-5">
    {projects.map((p) => (
      <ProjectCard key={p._id} project={p} />
    ))}
  </div>
);

// ── Slider Layout ─────────────────────────────────────────────────────────
const SliderView = ({ projects }) => {
  const [current, setCurrent] = useState(0);
  const total = projects.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  // Show 1 card on mobile, 2 on sm+
  const getVisible = () => {
    if (total === 0) return [];
    // always show current + next (wrap)
    return [
      projects[current % total],
      projects[(current + 1) % total],
    ].filter(Boolean);
  };

  return (
    <div className="relative">
      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-5 transition-all duration-300">
        {getVisible().map((p, i) => (
          <div
            key={p._id + i}
            className="transition-all duration-300"
            style={{ opacity: 1 }}
          >
            <ProjectCard project={p} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors"
        >
          <FiChevronLeft size={18} />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === current
                  ? "bg-purple-400 w-5"
                  : "bg-purple-800 hover:bg-purple-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-10 h-10 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors"
        >
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Counter */}
      <p className="text-center text-gray-600 text-xs mt-3">
        {current + 1} / {total}
      </p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const CourseProjectsSection = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/course-projects")
      .then((res) => {
        setSettings(res.data.settings || DEFAULT_SETTINGS);
        setProjects(res.data.projects?.length ? res.data.projects : DEFAULT_PROJECTS);
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
        setProjects(DEFAULT_PROJECTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ background: "#0d011f" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
          {settings.heading}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          {settings.subtitle}
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : settings.displayStyle === "slider" ? (
          <SliderView projects={projects} />
        ) : (
          <GridView projects={projects} />
        )}
      </div>
    </section>
  );
};

export default CourseProjectsSection;
