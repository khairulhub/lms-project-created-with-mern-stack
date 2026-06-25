import { useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import api from "../../../utils/api";

const DEFAULT_SETTINGS = {
  heading:  "সচরাচর জিজ্ঞাসা",
  subtitle: "তোমার মনে যা আসছে সেই প্রশ্নের উত্তর এখানে আছে",
};

const DEFAULT_FAQS = [
  { _id: "f1", question: "কোনো পূর্ব অভিজ্ঞতা ছাড়া কি এই কোর্স করা যাবে?",  answer: "হ্যাঁ! একদম শুরু থেকে শেখানো হয়। Computer চালাতে পারলেই যথেষ্ট।" },
  { _id: "f2", question: "কোর্সটি কতদিনে শেষ করা যাবে?",                       answer: "সাধারণত ১৬ সপ্তাহে শেষ হয়। তবে লাইফটাইম অ্যাক্সেস থাকায় নিজের গতিতে শিখতে পারবে।" },
  { _id: "f3", question: "পেমেন্ট কীভাবে করব?",                                  answer: "bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড বা ব্যাংক ট্রান্সফার — সব উপায়ে করা যাবে।" },
  { _id: "f4", question: "Certificate কি দেওয়া হবে?",                            answer: "হ্যাঁ, কোর্স সম্পন্ন করলে আন্তর্জাতিকভাবে স্বীকৃত Certificate পাবে।" },
  { _id: "f5", question: "Job guarantee কি আছে?",                                 answer: "আমরা ১০০% job guarantee দিই না, তবে job support, mock interview এবং referral দিয়ে থাকি।" },
  { _id: "f6", question: "মানি-ব্যাক গ্যারান্টি কি সত্যিই আছে?",                answer: "হ্যাঁ, ৩০ দিনের মধ্যে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত — কোনো প্রশ্ন ছাড়াই।" },
];

const FAQItem = ({ faq, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-purple-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#220a40" : "#1a0533" }}
      >
        <span className="text-white font-semibold text-sm pr-4">{faq.question}</span>
        {open
          ? <FiChevronUp className="text-purple-400 shrink-0" />
          : <FiChevronDown className="text-purple-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4" style={{ background: "#12032a" }}>
          <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
};

const CourseFAQSection = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [faqs,     setFaqs]     = useState(DEFAULT_FAQS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/course-faq")
      .then((res) => {
        setSettings(res.data.settings || DEFAULT_SETTINGS);
        setFaqs(res.data.faqs?.length ? res.data.faqs : DEFAULT_FAQS);
      })
      .catch(() => { setSettings(DEFAULT_SETTINGS); setFaqs(DEFAULT_FAQS); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ background: "#0d011f" }} className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
          {settings.heading}
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">{settings.subtitle}</p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-800/50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={faq._id} faq={faq} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseFAQSection;
