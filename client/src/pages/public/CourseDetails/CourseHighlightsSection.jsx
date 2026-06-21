import { useEffect, useState } from "react";
import api from "../../../utils/api";

// ── FALLBACK DEFAULTS ────────────────────────────────────────────────────
// Used ONLY when the database/API isn't reachable, or while the very first
// fetch is still loading. The moment the DB responds, these are replaced by
// whatever is actually in the database for that category.
const DEFAULT_SECTION = {
  heading: "এই কোর্সে তুমি কী পাবে?",
  subtitle: "একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট",
  techTagsLabel: "যা যা শিখবে:",
  techTags: ["HTML", "CSS", "Tailwind", "JavaScript", "React", "Node.js", "Express", "MongoDB", "Firebase", "Git", "REST API", "JWT"],
};

const DEFAULT_ITEMS = [
  { _id: "default-1", emoji: "🤖", icon: "🤖", title: "AI-Powered Learning", description: "AI tools দিয়ে faster এবং smarter ভাবে কোড শেখো" },
  { _id: "default-2", emoji: "📋", icon: "📋", title: "Structured Path", description: "Week-by-week structured curriculum তোমাকে গাইড করবে" },
  { _id: "default-3", emoji: "🌐", icon: "🌐", title: "Full Stack Skills", description: "Frontend থেকে Backend — সব কিছু এক জায়গায়" },
  { _id: "default-4", emoji: "💼", icon: "💼", title: "Job Ready", description: "ইন্টারভিউ প্রেপ, CV রিভিউ এবং জব সাপোর্ট" },
];

// Props:
//   categorySlug — which category's highlights to show (e.g. "mern-stack").
//                  Falls back to showing DEFAULT content if not provided
//                  or if the API call fails.
const CourseHighlightsSection = ({ categorySlug }) => {
  const [section, setSection] = useState(DEFAULT_SECTION);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) {
      setSection(DEFAULT_SECTION);
      setItems(DEFAULT_ITEMS);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/course-highlights/${categorySlug}`)
      .then((res) => {
        setSection(res.data.section || DEFAULT_SECTION);
        setItems(res.data.items?.length ? res.data.items : DEFAULT_ITEMS);
      })
      .catch(() => {
        setSection(DEFAULT_SECTION);
        setItems(DEFAULT_ITEMS);
      })
      .finally(() => setLoading(false));
  }, [categorySlug]);

  return (
    <section style={{ background: "#0d011f" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
          {section.heading}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          {section.subtitle}
        </p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {items.map((item) => (
              <div key={item._id}
                className="rounded-2xl p-5 border border-purple-800 hover:border-purple-500 transition-all group"
                style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2 group-hover:text-purple-300 transition-colors">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tech tags */}
        {section.techTags?.length > 0 && (
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-4">{section.techTagsLabel}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {section.techTags.map((t) => (
                <span key={t} className="border border-purple-800 text-purple-200 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: "#1a0533" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseHighlightsSection;
