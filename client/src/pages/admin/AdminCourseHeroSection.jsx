import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSave, FiImage, FiTrash2, FiRotateCcw } from "react-icons/fi";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Default/fake values — used only to "reset" a field in the UI, the real
// source of truth once saved is the single DB document.
const DEFAULTS = {
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

const AdminCourseHeroSection = () => {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Heading is one contentEditable rich-text box, not React-controlled on
  // every keystroke (that would reset the cursor). We set its innerHTML
  // once when data loads (see useEffect below), then read it back into
  // form.headingHtml on every input/selection change.
  const headingRef = useRef(null);

  // Single doc fetch — GET /course-hero returns the one DB document
  // (auto-creates with defaults on the backend the first time).
  const fetchHero = () => {
    setLoading(true);
    api.get("/course-hero")
      .then((res) => setForm(res.data))
      .catch(() => toast.error("Hero section load korte parlam na"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHero(); }, []);

  // Push loaded headingHtml into the contentEditable box exactly once when
  // loading finishes (not on every render — that would wipe the cursor
  // position while the admin is typing).
  useEffect(() => {
    if (!loading && headingRef.current) {
      headingRef.current.innerHTML = form.headingHtml || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Read the current contentEditable HTML back into form state.
  const syncHeadingFromDOM = () => {
    if (headingRef.current) setField("headingHtml", headingRef.current.innerHTML);
  };

  // "Apply Gradient" — wrap the currently-selected text (inside the heading
  // editor) in <span class="gradient-text">...</span>. Select any word(s),
  // click this button — works no matter where in the heading the selection is.
  const applyGradient = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      return toast.error("আগে heading-এর মধ্যে থেকে কিছু text select করুন");
    }
    const range = sel.getRangeAt(0);
    if (!headingRef.current || !headingRef.current.contains(range.commonAncestorContainer)) {
      return toast.error("Heading box-এর ভিতরে text select করুন");
    }
    const span = document.createElement("span");
    span.className = "gradient-text";
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    syncHeadingFromDOM();
  };

  // "Remove Gradient" — unwrap the gradient-text span around the current
  // cursor/selection, putting that text back to plain white.
  const removeGradient = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentNode; // text node -> its element
    const span = node.closest && node.closest("span.gradient-text");
    if (!span) return toast.error("Cursor/selection ekta gradient text-er upore rakhun");
    const parent = span.parentNode;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    sel.removeAllRanges();
    syncHeadingFromDOM();
  };

  const setStat = (idx, key, value) => {
    const stats = [...(form.stats || [])];
    stats[idx] = { ...stats[idx], [key]: value };
    setField("stats", stats);
  };

  // Single doc, single "Save" — this PUT updates that one document, no
  // create/delete of new rows. (Deleting the section entirely doesn't make
  // sense for a singleton, so we offer "Reset to default" instead — see below.)
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/admin/course-hero", form);
      setForm(res.data);
      toast.success("Hero section saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  // "Delete" for a singleton = reset every field back to the original fake/default
  // values, then save. There's no separate row to actually remove.
  const handleResetToDefault = async () => {
    if (!window.confirm("Shob field default value-te reset hobe. Continue?")) return;
    setForm(DEFAULTS);
    if (headingRef.current) headingRef.current.innerHTML = DEFAULTS.headingHtml;
    setSaving(true);
    try {
      const res = await api.put("/admin/course-hero", DEFAULTS);
      setForm(res.data);
      toast.success("Reset to default!");
    } catch (err) {
      toast.error("Reset failed");
    } finally { setSaving(false); }
  };

  // imgBB instructor image upload (same pattern as AdminNavMenu logo upload)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_API_KEY) return toast.error("Add VITE_IMGBB_API_KEY to .env");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setField("instructorImage", data.data.url);
        toast.success("Image uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch { toast.error("Upload error"); }
    finally { setUploadingImage(false); }
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelClass = "block text-xs text-gray-400 mb-1";

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400 text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Course Hero Section</h2>
            <p className="text-gray-500 text-sm mt-1">Course Details &gt; Course Hero Section</p>
          </div>
          <button onClick={handleResetToDefault}
            className="flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-xl text-xs transition-colors">
            <FiRotateCcw size={13} /> Reset to default
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-white font-semibold mb-2 text-lg">Text & Heading</h3>

          <div>
            <label className={labelClass}>Top Badge Text</label>
            <input value={form.badgeText} onChange={(e) => setField("badgeText", e.target.value)} className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Heading</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={applyGradient}
                  className="text-xs px-3 py-1.5 rounded-lg border border-purple-500 text-purple-300 hover:bg-purple-500/10 transition-colors">
                  Apply Gradient
                </button>
                <button type="button" onClick={removeGradient}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
                  Remove Gradient
                </button>
              </div>
              {/* Type the full heading here, then select any word(s) and click
                  "Apply Gradient" to color just that part — gradient can go
                  anywhere in the heading, not just a fixed first/last part. */}
              <div
                ref={headingRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncHeadingFromDOM}
                onBlur={syncHeadingFromDOM}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 text-lg">Stats (4 boxes)</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {(form.stats || []).map((s, i) => (
              <div key={i} className="flex gap-2">
                <input value={s.value} onChange={(e) => setStat(i, "value", e.target.value)}
                  placeholder="Value" className={inputClass} />
                <input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)}
                  placeholder="Label" className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-white font-semibold mb-2 text-lg">Buttons & Guarantee</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Primary Button Text</label>
              <input value={form.primaryButtonText} onChange={(e) => setField("primaryButtonText", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Primary Button Link</label>
              <input value={form.primaryButtonLink} onChange={(e) => setField("primaryButtonLink", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Secondary Button Text</label>
            <input value={form.secondaryButtonText} onChange={(e) => setField("secondaryButtonText", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Secondary Button URL (e.g. demo video link)</label>
            <input value={form.secondaryButtonLink} onChange={(e) => setField("secondaryButtonLink", e.target.value)}
              placeholder="https://youtube.com/..." className={inputClass} />
            <p className="text-gray-600 text-xs mt-1">Khali rakhle button click-e kichu hobe na — URL dile new tab-e khulbe.</p>
          </div>
          <div>
            <label className={labelClass}>Guarantee Line (small text under buttons)</label>
            <input value={form.guaranteeText} onChange={(e) => setField("guaranteeText", e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Instructor card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-lg">Instructor Card (right side)</h3>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.showInstructorCard}
                onChange={(e) => setField("showInstructorCard", e.target.checked)}
                className="accent-cyan-500" />
              Show on page
            </label>
          </div>

          {form.showInstructorCard && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Instructor Name</label>
                  <input value={form.instructorName} onChange={(e) => setField("instructorName", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Title</label>
                  <input value={form.instructorTitle} onChange={(e) => setField("instructorTitle", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input value={form.instructorSubtitle} onChange={(e) => setField("instructorSubtitle", e.target.value)} className={inputClass} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bestseller Badge Text</label>
                  <input value={form.bestsellerBadgeText} onChange={(e) => setField("bestsellerBadgeText", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Job Support Badge Text</label>
                  <input value={form.jobSupportBadgeText} onChange={(e) => setField("jobSupportBadgeText", e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* imgBB image upload */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Instructor Image (via imgBB)</label>
                <div className="flex items-center gap-4">
                  {form.instructorImage && (
                    <img src={form.instructorImage} alt="instructor" className="h-16 w-16 object-cover rounded-xl border border-gray-700" />
                  )}
                  <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-sm">
                    <FiImage size={14} />
                    {uploadingImage ? "Uploading..." : "Upload image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {form.instructorImage && (
                    <button onClick={() => setField("instructorImage", "")}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs">
                      <FiTrash2 size={12} /> Remove (use emoji instead)
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-xs mt-2">Image na dile age jemon emoji + gradient dekhabe.</p>
              </div>
            </>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          <FiSave size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseHeroSection;
