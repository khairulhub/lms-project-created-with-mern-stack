import { useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp, FiPlay } from "react-icons/fi";
import api from "../../../utils/api";

// ── FALLBACK DEFAULTS ────────────────────────────────────────────────────
const DEFAULT_SECTION = {
  heading: "কোর্সের সিলেবাস",
  subtitle: "সম্পূর্ণ কোর্স কারিকুলাম একনজরে দেখো",
};

const DEFAULT_MODULES = [
  {
    _id: "default-1", week: "Week 1-2", title: "HTML & CSS Foundation",
    lessons: 18, duration: "6h 30m",
    topics: ["HTML5 Semantic Elements", "CSS Box Model ও Flexbox", "CSS Grid Layout", "Responsive Design", "Tailwind CSS Basics", "Mini Project: Portfolio Page"],
  },
  {
    _id: "default-2", week: "Week 3-5", title: "JavaScript Essentials",
    lessons: 24, duration: "9h 15m",
    topics: ["Variables, Functions, Scope", "Arrays ও Objects", "DOM Manipulation", "Events ও Event Listeners", "ES6+: Arrow Functions, Destructuring", "Promises, Async/Await, Fetch API"],
  },
  {
    _id: "default-3", week: "Week 6-9", title: "React.js Deep Dive",
    lessons: 30, duration: "13h 40m",
    topics: ["React Fundamentals ও JSX", "Components, Props, State", "useState, useEffect, useContext", "React Router v6", "Form Handling", "Project: E-commerce App"],
  },
  {
    _id: "default-4", week: "Week 10-12", title: "Backend — Node.js & Express",
    lessons: 22, duration: "9h 20m",
    topics: ["Node.js Basics ও NPM", "Express Framework", "REST API Design", "Middleware", "JWT Authentication", "File Upload"],
  },
  {
    _id: "default-5", week: "Week 13-14", title: "Database — MongoDB",
    lessons: 16, duration: "6h 45m",
    topics: ["MongoDB Atlas Setup", "CRUD Operations", "Mongoose Schema", "Relationships", "Aggregation Pipeline"],
  },
  {
    _id: "default-6", week: "Week 15-16", title: "Final Project ও Job Prep",
    lessons: 14, duration: "7h 00m",
    topics: ["Full Stack MERN Project", "GitHub Portfolio", "Resume Building", "Interview Prep", "Freelancing Tips", "Job Application Guide"],
  },
];

// ── Accordion ────────────────────────────────────────────────────────────
const Accordion = ({ mod, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-purple-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#220a40" : "#1a0533" }}
      >
        <span className="text-white font-semibold text-sm pr-4">
          {mod.week} — {mod.title}
          {(mod.lessons > 0 || mod.duration) && (
            <span className="text-purple-400 font-normal ml-1">
              ({mod.lessons > 0 ? `${mod.lessons} লেসন` : ""}
              {mod.lessons > 0 && mod.duration ? " · " : ""}
              {mod.duration || ""})
            </span>
          )}
        </span>
        {open
          ? <FiChevronUp className="text-purple-400 shrink-0" />
          : <FiChevronDown className="text-purple-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4" style={{ background: "#12032a" }}>
          {mod.topics?.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {mod.topics.map((topic, j) => (
                <div key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <FiPlay size={11} className="text-purple-400 shrink-0" />
                  {topic}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Topics coming soon...</p>
          )}
        </div>
      )}
    </div>
  );
};

const CourseCurriculumSection = ({ categorySlug }) => {
  const [section, setSection] = useState(DEFAULT_SECTION);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) {
      setSection(DEFAULT_SECTION);
      setModules(DEFAULT_MODULES);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/course-curriculum/${categorySlug}`)
      .then((res) => {
        setSection(res.data.section || DEFAULT_SECTION);
        setModules(res.data.modules?.length ? res.data.modules : DEFAULT_MODULES);
      })
      .catch(() => {
        setSection(DEFAULT_SECTION);
        setModules(DEFAULT_MODULES);
      })
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const totalLessons = modules.reduce((a, m) => a + (m.lessons || 0), 0);

  return (
    <section style={{ background: "#120326" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-2">
          {section.heading}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          {!loading && (
            <>
              {totalLessons > 0 && `${totalLessons} টি লেসন · `}
              {modules.length} টি মডিউল
              {" · "}
            </>
          )}
          {section.subtitle}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, i) => (
              <Accordion key={mod._id || i} mod={mod} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseCurriculumSection;