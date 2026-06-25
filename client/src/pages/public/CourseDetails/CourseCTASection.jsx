import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlay } from "react-icons/fi";
import api from "../../../utils/api";
import { useAuth } from "../../../contexts/AuthContext";

const DEFAULT_CTA = {
  heading:          "আজই শুরু করো তোমার ক্যারিয়ার জার্নি 🚀",
  subtitle:         "হাজারো শিক্ষার্থী ইতিমধ্যে শুরু করে ফেলেছে। তুমি কি পিছিয়ে থাকবে? আজই ভর্তি হও এবং ৩০ দিনের মানি-ব্যাক গ্যারান্টি উপভোগ করো।",
  primaryBtnText:   "এখনই ভর্তি হও — ৳৪,৫০০",
  secondaryBtnText: "Free Demo দেখো",
  trustBadges:      ["✅ ৩০ দিনের মানি-ব্যাক", "✅ লাইফটাইম অ্যাক্সেস", "✅ Certificate", "✅ Community Support"],
  gradientFrom:     "#3b0764",
  gradientVia:      "#1a0533",
  gradientTo:       "#500724",
};

const CourseCTASection = () => {
  const [cta,     setCta]     = useState(DEFAULT_CTA);
  const [loading, setLoading] = useState(true);
  const navigate  = useNavigate();
  const { user }  = useAuth();

  useEffect(() => {
    api.get("/course-cta")
      .then((res) => setCta(res.data || DEFAULT_CTA))
      .catch(() => setCta(DEFAULT_CTA))
      .finally(() => setLoading(false));
  }, []);

  // Both buttons: logged in → /categories, logged out → /login
  const handleCTAClick = () => {
    if (user) navigate("/categories");
    else      navigate("/login");
  };

  if (loading) return null;

  return (
    <section
      className="py-16 px-4"
      style={{
        background: `linear-gradient(135deg, ${cta.gradientFrom}, ${cta.gradientVia}, ${cta.gradientTo})`,
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          {cta.heading}
        </h2>
        <p className="text-purple-200 text-base mb-8 leading-relaxed">
          {cta.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {/* Primary button — enroll / login */}
          <button
            onClick={handleCTAClick}
            className="bg-white hover:bg-gray-100 font-extrabold px-10 py-4 rounded-2xl transition-all hover:scale-105 text-lg"
            style={{ color: "#3b0764" }}
          >
            {cta.primaryBtnText}
          </button>

          {/* Secondary button — demo / login */}
          <button
            onClick={handleCTAClick}
            className="flex items-center justify-center gap-2 text-white font-medium px-8 py-4 rounded-2xl transition-colors border-2 hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            <FiPlay size={16} /> {cta.secondaryBtnText}
          </button>
        </div>

        {/* Trust badges */}
        {cta.trustBadges?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 text-sm text-purple-300">
            {cta.trustBadges.map((badge, i) => (
              <span key={i}>{badge}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseCTASection;
