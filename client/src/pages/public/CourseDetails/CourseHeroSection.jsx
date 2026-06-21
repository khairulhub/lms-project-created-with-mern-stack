import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import {
  FiArrowRight, FiCalendar, FiUser,
  FiCheck, FiChevronDown, FiChevronUp, FiStar,
  FiPlay, FiThumbsUp,
} from "react-icons/fi";

// Same values as the DB defaults / seed data — used as a fallback so the
// section still looks right (a) before the API call resolves, and
// (b) if the API call fails for any reason.
const FAKE_DATA = {
  badgeText: "পূর্ণ বাংলায় শিখো এবং তোমার ক্যারিয়ার গড়ো Full Stack Web Engineer হিসেবে",
  headingHtml: '<span class="gradient-text">AI-Driven</span> Web Development Course',
  description: "HTML, CSS, JavaScript, React, Node.js, MongoDB সহ সম্পূর্ণ Full Stack Web Development শেখো। প্রজেক্ট বানাও, পোর্টফোলিও তৈরি করো এবং ক্যারিয়ার শুরু করো।",
  stats: [
    { value: "৩০০০+", label: "শিক্ষার্থী" },
    { value: "৪.৮★", label: "রেটিং" },
    { value: "৬০+", label: "ঘণ্টার কন্টেন্ট" },
    { value: "৫০০+", label: "জব প্লেসমেন্ট" },
  ],
  primaryButtonText: "এখনই ভর্তি হও",
  primaryButtonLink: "/enroll",
  secondaryButtonText: "Demo দেখো",
  secondaryButtonLink: "",
  guaranteeText: "✅ ৩০ দিনের মানি-ব্যাক গ্যারান্টি \u00a0·\u00a0 ✅ লাইফটাইম অ্যাক্সেস",
  showInstructorCard: true,
  instructorImage: "",
  instructorName: "Jhankar Mahbub",
  instructorTitle: "Lead Instructor",
  instructorSubtitle: "Ex-Google Engineer",
  bestsellerBadgeText: "🔥 BESTSELLER",
  jobSupportBadgeText: "✅ Job Support",
};

// showInstructorCard, instructorImage etc. — sob ekhon DB theke ashe (admin panel
// "Course Details > Course Hero Section" theke edit kora jay). DB connect na
// hoya porjonto / fetch fail korle upore FAKE_DATA dekhabe, kono crash hobe na.
const CourseHeroSection = () => {
  // Prothome fake data diye render kori — page khali na dekhanor jonno.
  const [hero, setHero] = useState(FAKE_DATA);

  useEffect(() => {
    // Load houar por backend theke fetch kore real data bosiye dei.
    api.get("/course-hero")
      .then((res) => setHero(res.data))
      .catch(() => {
        // DB/API ekhono connect na hoile fake data e thake, kichu bhange na.
      });
  }, []);

  const {
    badgeText, headingHtml, description, stats,
    primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, guaranteeText,
    showInstructorCard, instructorImage, instructorName, instructorTitle,
    instructorSubtitle, bestsellerBadgeText, jobSupportBadgeText,
  } = hero;

  return (
    <section id="course-top" style={{ background: "linear-gradient(135deg, #0d011f 0%, #1a0335 50%, #0a0118 100%)" }}
      className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className={
          showInstructorCard
            ? "grid lg:grid-cols-2 gap-12 items-center"
            : "flex flex-col items-center text-center"
        }>

          {/* Left */}
          <div className={showInstructorCard ? "" : "max-w-3xl"}>
            {showInstructorCard ? (
              <p className="text-purple-400 font-medium text-sm mb-3">
                {badgeText}
              </p>
            ) : (
                 <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            {badgeText}
          </div>
            )}

            {showInstructorCard ? (
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4"
                dangerouslySetInnerHTML={{ __html: headingHtml }} />
            ) : (
              <h2 className="text-2xl md:text-6xl font-extrabold text-white leading-tight mb-4"
                dangerouslySetInnerHTML={{ __html: headingHtml }} />
            )}

            <p className="text-gray-300 text-base mb-6 leading-relaxed">
              {description}
            </p>

            {/* Stats */}
            <div className={
              showInstructorCard
                ? "flex flex-wrap gap-8 mb-8"
                : "flex flex-wrap gap-8 mb-8 justify-center"
            }>
              {(stats || []).map((s, i) => (
                <div key={s.label || i} className="text-center">
                  <div className="text-2xl font-extrabold text-purple-300">{s.value}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className={
              showInstructorCard
                ? "flex flex-wrap gap-3 mb-5"
                : "flex flex-wrap gap-3 mb-5 justify-center"
            }>
              <Link to={primaryButtonLink || "/enroll"}
                className="font-extrabold px-8 py-3.5 rounded-xl text-white text-base transition-all hover:scale-105"
                style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}>
                {primaryButtonText}
              </Link>
              {secondaryButtonLink ? (
                <a href={secondaryButtonLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-purple-500 text-purple-300 font-medium px-6 py-3.5 rounded-xl text-base hover:border-purple-400 transition-colors">
                  <FiPlay size={14} /> {secondaryButtonText}
                </a>
              ) : (
                <button type="button"
                  className="flex items-center gap-2 border border-purple-500 text-purple-300 font-medium px-6 py-3.5 rounded-xl text-base hover:border-purple-400 transition-colors">
                  <FiPlay size={14} /> {secondaryButtonText}
                </button>
              )}
            </div>
            <p className="text-gray-500 text-xs">{guaranteeText}</p>
          </div>

          {/* Right — instructor card (admin theke off thakle eta render hobe na) */}
          {showInstructorCard && (
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-72 h-80 rounded-2xl border border-purple-700 flex items-center justify-center overflow-hidden"
                  style={
                    instructorImage
                      ? {
                          backgroundImage: `url(${instructorImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : { background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(219,39,119,0.1))" }
                  }
                >
                  {instructorImage ? (
                    // Image thakle, niche ekta dark gradient overlay diye naam/title dekhabo
                    // jate text image er upore porhajogyo thake.
                    <div
                      className="w-full h-full flex flex-col justify-end p-6"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                      }}
                    >
                      <p className="text-white font-bold text-lg">{instructorName}</p>
                      <p className="text-purple-300 text-sm">{instructorTitle}</p>
                      <p className="text-gray-300 text-xs mt-1">{instructorSubtitle}</p>
                    </div>
                  ) : (
                    // Image na thakle, age jemon chilo - emoji + gradient
                    <div className="text-center p-6">
                      <div className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
                        👨‍💻
                      </div>
                      <p className="text-white font-bold text-lg">{instructorName}</p>
                      <p className="text-purple-300 text-sm">{instructorTitle}</p>
                      <p className="text-gray-400 text-xs mt-1">{instructorSubtitle}</p>
                    </div>
                  )}
                </div>
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                  {bestsellerBadgeText}
                </div>
                <div className="absolute -bottom-3 -left-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {jobSupportBadgeText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CourseHeroSection;
