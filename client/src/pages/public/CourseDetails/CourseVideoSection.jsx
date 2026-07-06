import { useEffect, useState } from "react";
import api from "../../../utils/api";

// ── FALLBACK DEFAULTS ────────────────────────────────────────────────────
const DEFAULT_SECTION = {
  heading: "কোর্সের একটু আভাস নাও",
  subtitle: "ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই",
  videoType: "youtube",
  videoUrl: "https://www.youtube.com/embed/zAbT_zvSaM4",
  uploadedVideoPath: "",
};

// Backend's API base usually ends in "/api" — strip that to get the
// server's actual origin. Only needed for legacy local-disk uploads (saved
// as a relative "/uploads/videos/..." path); Cloudinary uploads already
// store a full absolute URL (https://res.cloudinary.com/...).
const SERVER_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const resolveVideoSrc = (uploadedVideoPath) =>
  /^https?:\/\//.test(uploadedVideoPath || "") ? uploadedVideoPath : `${SERVER_ORIGIN}${uploadedVideoPath}`;

// Props:
//   categorySlug — which category's preview video to show (e.g. "mern-stack")
const CourseVideoSection = ({ categorySlug }) => {
  const [section, setSection] = useState(DEFAULT_SECTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) {
      setSection(DEFAULT_SECTION);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/course-video/${categorySlug}`)
      .then((res) => setSection(res.data.section || DEFAULT_SECTION))
      .catch(() => setSection(DEFAULT_SECTION))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const isUpload = section.videoType === "upload" && section.uploadedVideoPath;

  return (
    <section style={{ background: "#120326" }} className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
          {section.heading}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8">{section.subtitle}</p>

        <div className="relative w-full rounded-2xl overflow-hidden border border-purple-800"
          style={{ aspectRatio: "16/9", background: "#0d011f" }}>
          {loading ? (
            <div className="absolute inset-0 bg-gray-800/60 animate-pulse" />
          ) : isUpload ? (
            <video
              key={section.uploadedVideoPath}
              src={resolveVideoSrc(section.uploadedVideoPath)}
              controls
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <iframe
              src={section.videoUrl}
              title="Course Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseVideoSection;
