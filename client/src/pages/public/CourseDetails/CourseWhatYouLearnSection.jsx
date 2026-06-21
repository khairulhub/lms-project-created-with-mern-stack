import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import api from "../../../utils/api";

// ── FALLBACK DEFAULTS ────────────────────────────────────────────────────
const DEFAULT_SECTION = {
  heading: "কী কী শিখবে এই কোর্সে?",
  subtitle: "শেষ করলে তুমি একজন দক্ষ Full Stack Developer হয়ে যাবে",
};

const DEFAULT_ITEMS = [
  "HTML5 ও CSS3 দিয়ে সুন্দর ওয়েবসাইট বানানো",
  "Tailwind CSS দিয়ে Responsive Design",
  "JavaScript ES6+ এর সব আধুনিক ফিচার",
  "React.js দিয়ে Dynamic UI তৈরি",
  "React Router, Context API, Hooks",
  "Node.js ও Express দিয়ে REST API",
  "MongoDB ও Mongoose দিয়ে Database",
  "Firebase Authentication সেটআপ",
  "JWT দিয়ে Secure Login System",
  "Git ও GitHub ব্যবহার",
  "Vercel ও Netlify তে Deploy করা",
  "Interview Preparation ও DSA Basics",
].map((text, i) => ({ _id: `default-${i}`, text }));

// Props:
//   categorySlug — which category's checklist to show (e.g. "mern-stack")
const CourseWhatYouLearnSection = ({ categorySlug }) => {
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
    api.get(`/course-what-you-learn/${categorySlug}`)
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
        <p className="text-gray-400 text-center text-sm mb-10">{section.subtitle}</p>

        <div className="rounded-2xl border border-purple-800 p-8"
          style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-800/60 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((item, i) => (
                <div key={item._id || i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}>
                    <FiCheck size={11} className="text-green-400" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseWhatYouLearnSection;
