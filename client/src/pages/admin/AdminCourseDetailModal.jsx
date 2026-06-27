import { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiX, FiPlus, FiEdit2, FiTrash2, FiSave, FiChevronDown, FiChevronUp,
  FiVideo, FiBook, FiStar, FiHelpCircle, FiCheckSquare, FiList, FiPlay,
} from "react-icons/fi";

// ── shared styles ────────────────────────────────────────────────────────────
const inp  = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const lbl  = "block text-xs font-medium text-gray-400 mb-1";
const btn  = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors";
const addBtn = btn + " bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20";
const delBtn = btn + " bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20";
const saveBtn = btn + " bg-cyan-500 text-gray-950 hover:bg-cyan-400";

// ── Tiny inline editor helper ────────────────────────────────────────────────
const InlineEdit = ({ value, onSave, onCancel, multiline = false, placeholder = "" }) => {
  const [v, setV] = useState(value);
  return (
    <div className="flex flex-col gap-2 w-full">
      {multiline
        ? <textarea rows={2} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className={inp + " resize-none"} />
        : <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className={inp} />
      }
      <div className="flex gap-2">
        <button onClick={() => onSave(v)} className={saveBtn}><FiSave size={12}/> Save</button>
        <button onClick={onCancel} className={btn + " bg-gray-700 text-gray-300 hover:bg-gray-600"}>Cancel</button>
      </div>
    </div>
  );
};

// ── Section wrapper with accordion ──────────────────────────────────────────
const Section = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-gray-800/60 text-left hover:bg-gray-800 transition-colors">
        <span className="flex items-center gap-2.5 text-white font-semibold text-sm">
          <Icon size={15} className="text-cyan-400" /> {title}
        </span>
        {open ? <FiChevronUp className="text-gray-500" size={15}/> : <FiChevronDown className="text-gray-500" size={15}/>}
      </button>
      {open && <div className="p-5 space-y-3">{children}</div>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const AdminCourseDetailModal = ({ course, onClose }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // intro video form
  const [introUrl,  setIntroUrl]  = useState("");
  const [introType, setIntroType] = useState("youtube");

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/admin/course-details/${course._id}`);
      setDetail(r.data);
      setIntroUrl(r.data.introVideoUrl  || "");
      setIntroType(r.data.introVideoType || "youtube");
    } catch { toast.error("Details load hoyni"); }
    finally { setLoading(false); }
  }, [course._id]);

  useEffect(() => { load(); }, [load]);

  // prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── generic API helpers ────────────────────────────────────────────────
  const put    = async (path, body) => { const r = await api.put(path, body);    setDetail(r.data); return r.data; };
  const post   = async (path, body) => { const r = await api.post(path, body);   setDetail(r.data); return r.data; };
  const del    = async (path)       => { const r = await api.delete(path);        setDetail(r.data); };

  const base = `/admin/course-details/${course._id}`;

  // ── save intro video ───────────────────────────────────────────────────
  const saveIntro = async () => {
    setSaving(true);
    try { await put(base, { introVideoUrl: introUrl, introVideoType: introType }); toast.success("Saved!"); }
    catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  // ── What You Get ───────────────────────────────────────────────────────
  const [wygForm, setWygForm] = useState("");
  const [wygEdit, setWygEdit] = useState(null); // { id, text }

  const addWYG = async () => {
    if (!wygForm.trim()) return;
    try { await post(`${base}/what-you-get`, { text: wygForm.trim() }); setWygForm(""); toast.success("Added"); }
    catch { toast.error("Failed"); }
  };
  const saveWYG = async (id, text) => {
    try { await put(`${base}/what-you-get/${id}`, { text }); setWygEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delWYG = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await del(`${base}/what-you-get/${id}`); }
    catch { toast.error("Failed"); }
  };

  // ── Requirements ───────────────────────────────────────────────────────
  const [reqForm, setReqForm] = useState("");
  const [reqEdit, setReqEdit] = useState(null);

  const addReq = async () => {
    if (!reqForm.trim()) return;
    try { await post(`${base}/requirements`, { text: reqForm.trim() }); setReqForm(""); }
    catch { toast.error("Failed"); }
  };
  const saveReq = async (id, text) => {
    try { await put(`${base}/requirements/${id}`, { text }); setReqEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delReq = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await del(`${base}/requirements/${id}`); }
    catch { toast.error("Failed"); }
  };

  // ── FAQs ───────────────────────────────────────────────────────────────
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [faqEdit, setFaqEdit] = useState(null);

  const addFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return toast.error("Question & answer required");
    try { await post(`${base}/faqs`, faqForm); setFaqForm({ question: "", answer: "" }); }
    catch { toast.error("Failed"); }
  };
  const saveFaq = async (id, data) => {
    try { await put(`${base}/faqs/${id}`, data); setFaqEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delFaq = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await del(`${base}/faqs/${id}`); }
    catch { toast.error("Failed"); }
  };

  // ── Reviews ────────────────────────────────────────────────────────────
  const EMPTY_REVIEW = { name: "", role: "", avatarSeed: "", rating: 5, text: "" };
  const [revForm, setRevForm] = useState(EMPTY_REVIEW);
  const [revEdit, setRevEdit] = useState(null);

  const addRev = async () => {
    if (!revForm.name.trim() || !revForm.text.trim()) return toast.error("Name & text required");
    try { await post(`${base}/reviews`, revForm); setRevForm(EMPTY_REVIEW); }
    catch { toast.error("Failed"); }
  };
  const saveRev = async (id, data) => {
    try { await put(`${base}/reviews/${id}`, data); setRevEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delRev = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await del(`${base}/reviews/${id}`); }
    catch { toast.error("Failed"); }
  };

  // ── Curriculum ─────────────────────────────────────────────────────────
  const [secForm,    setSecForm]    = useState("");
  const [secEdit,    setSecEdit]    = useState(null);
  const [openSec,    setOpenSec]    = useState({}); // { sectionId: bool }
  const EMPTY_LEC = { title: "", duration: "", videoUrl: "", preview: false };
  const [lecForm,    setLecForm]    = useState({}); // { sectionId: {...} }
  const [lecEdit,    setLecEdit]    = useState(null); // { sectionId, lectureId, data }

  const addSection = async () => {
    if (!secForm.trim()) return;
    try { await post(`${base}/curriculum`, { title: secForm.trim() }); setSecForm(""); }
    catch { toast.error("Failed"); }
  };
  const saveSection = async (id, title) => {
    try { await put(`${base}/curriculum/${id}`, { title }); setSecEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delSection = async (id) => {
    if (!window.confirm("Delete section and all its lectures?")) return;
    try { await del(`${base}/curriculum/${id}`); }
    catch { toast.error("Failed"); }
  };

  const getLecForm = (sId) => lecForm[sId] || { ...EMPTY_LEC };
  const setOneLecForm = (sId, patch) => setLecForm((prev) => ({ ...prev, [sId]: { ...(prev[sId] || EMPTY_LEC), ...patch } }));

  const addLecture = async (sId) => {
    const lf = getLecForm(sId);
    if (!lf.title.trim()) return toast.error("Lecture title required");
    try {
      await post(`${base}/curriculum/${sId}/lectures`, lf);
      setLecForm((prev) => ({ ...prev, [sId]: { ...EMPTY_LEC } }));
    } catch { toast.error("Failed"); }
  };
  const saveLecture = async (sId, lId, data) => {
    try { await put(`${base}/curriculum/${sId}/lectures/${lId}`, data); setLecEdit(null); }
    catch { toast.error("Failed"); }
  };
  const delLecture = async (sId, lId) => {
    if (!window.confirm("Delete lecture?")) return;
    try { await del(`${base}/curriculum/${sId}/lectures/${lId}`); }
    catch { toast.error("Failed"); }
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 overflow-y-auto p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 rounded-t-2xl">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Course Details Manager</p>
            <h2 className="text-white font-bold text-base">{course.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><FiX size={20}/></button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm">Loading...</div>
        ) : (
          <div className="p-6 space-y-4">

            {/* ── INTRO VIDEO ─────────────────────────────────────────────── */}
            <Section icon={FiPlay} title="Intro / Preview Video" defaultOpen>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Video Type</label>
                  <select value={introType} onChange={(e) => setIntroType(e.target.value)} className={inp}>
                    <option value="youtube">YouTube Embed URL</option>
                    <option value="raw">Direct Video URL (mp4)</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Video URL</label>
                  <input value={introUrl} onChange={(e) => setIntroUrl(e.target.value)}
                    placeholder={introType === "youtube" ? "https://www.youtube.com/embed/..." : "https://...video.mp4"}
                    className={inp}
                  />
                </div>
                <button onClick={saveIntro} disabled={saving} className={saveBtn + " disabled:opacity-50"}>
                  <FiSave size={13}/> {saving ? "Saving..." : "Save Video"}
                </button>
              </div>
            </Section>

            {/* ── WHAT YOU GET ─────────────────────────────────────────────── */}
            <Section icon={FiCheckSquare} title="এই কোর্সে যা পাবে">
              <div className="space-y-2">
                {(detail?.whatYouGet || []).sort((a,b)=>a.order-b.order).map((item) => (
                  <div key={item._id} className="flex items-start gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
                    {wygEdit?.id === item._id ? (
                      <InlineEdit value={wygEdit.text} onSave={(t) => saveWYG(item._id, t)} onCancel={() => setWygEdit(null)} placeholder="Item text" />
                    ) : (
                      <>
                        <span className="text-cyan-400 shrink-0 mt-0.5">✓</span>
                        <span className="text-gray-200 text-sm flex-1">{item.text}</span>
                        <button onClick={() => setWygEdit({ id: item._id, text: item.text })} className="text-gray-500 hover:text-cyan-400 p-1"><FiEdit2 size={12}/></button>
                        <button onClick={() => delWYG(item._id)} className="text-gray-500 hover:text-red-400 p-1"><FiTrash2 size={12}/></button>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={wygForm} onChange={(e) => setWygForm(e.target.value)} placeholder="নতুন item যোগ করো" className={inp}
                    onKeyDown={(e) => { if (e.key === "Enter") addWYG(); }} />
                  <button onClick={addWYG} className={addBtn}><FiPlus size={13}/> Add</button>
                </div>
              </div>
            </Section>

            {/* ── REQUIREMENTS ─────────────────────────────────────────────── */}
            <Section icon={FiList} title="প্রয়োজনীয়তা (Requirements)">
              <div className="space-y-2">
                {(detail?.requirements || []).sort((a,b)=>a.order-b.order).map((item) => (
                  <div key={item._id} className="flex items-start gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
                    {reqEdit?.id === item._id ? (
                      <InlineEdit value={reqEdit.text} onSave={(t) => saveReq(item._id, t)} onCancel={() => setReqEdit(null)} placeholder="Requirement text" />
                    ) : (
                      <>
                        <span className="text-purple-400 shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                        <span className="text-gray-200 text-sm flex-1">{item.text}</span>
                        <button onClick={() => setReqEdit({ id: item._id, text: item.text })} className="text-gray-500 hover:text-cyan-400 p-1"><FiEdit2 size={12}/></button>
                        <button onClick={() => delReq(item._id)} className="text-gray-500 hover:text-red-400 p-1"><FiTrash2 size={12}/></button>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={reqForm} onChange={(e) => setReqForm(e.target.value)} placeholder="নতুন requirement" className={inp}
                    onKeyDown={(e) => { if (e.key === "Enter") addReq(); }} />
                  <button onClick={addReq} className={addBtn}><FiPlus size={13}/> Add</button>
                </div>
              </div>
            </Section>

            {/* ── CURRICULUM ───────────────────────────────────────────────── */}
            <Section icon={FiBook} title="কোর্স কারিকুলাম (Sections & Lectures)">
              <div className="space-y-3">
                {(detail?.curriculum || []).sort((a,b)=>a.order-b.order).map((sec) => (
                  <div key={sec._id} className="border border-gray-700 rounded-xl overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-3">
                      <button onClick={() => setOpenSec((p) => ({ ...p, [sec._id]: !p[sec._id] }))}
                        className="text-gray-400 hover:text-white">
                        {openSec[sec._id] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                      </button>
                      {secEdit?.id === sec._id ? (
                        <InlineEdit value={secEdit.title} onSave={(t) => saveSection(sec._id, t)} onCancel={() => setSecEdit(null)} placeholder="Section title" />
                      ) : (
                        <>
                          <span className="text-white font-semibold text-sm flex-1">{sec.title}</span>
                          <span className="text-gray-500 text-xs">{sec.lectures?.length || 0} lectures</span>
                          <button onClick={() => setSecEdit({ id: sec._id, title: sec.title })} className="text-gray-500 hover:text-cyan-400 p-1"><FiEdit2 size={12}/></button>
                          <button onClick={() => delSection(sec._id)} className="text-gray-500 hover:text-red-400 p-1"><FiTrash2 size={12}/></button>
                        </>
                      )}
                    </div>

                    {/* Lectures */}
                    {openSec[sec._id] && (
                      <div className="bg-gray-900 divide-y divide-gray-800">
                        {(sec.lectures || []).sort((a,b)=>a.order-b.order).map((lec) => (
                          <div key={lec._id} className="px-4 py-2.5">
                            {lecEdit?.sectionId === sec._id && lecEdit?.lectureId === lec._id ? (
                              <LectureEditForm data={lecEdit.data}
                                onChange={(patch) => setLecEdit((p) => ({ ...p, data: { ...p.data, ...patch } }))}
                                onSave={() => saveLecture(sec._id, lec._id, lecEdit.data)}
                                onCancel={() => setLecEdit(null)} />
                            ) : (
                              <div className="flex items-center gap-2">
                                <FiVideo size={13} className="text-gray-500 shrink-0"/>
                                <span className="text-gray-300 text-sm flex-1 truncate">{lec.title}</span>
                                {lec.preview && <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">Preview</span>}
                                <span className="text-gray-500 text-xs w-12 text-right">{lec.duration}</span>
                                <button onClick={() => setLecEdit({ sectionId: sec._id, lectureId: lec._id, data: { title: lec.title, duration: lec.duration, videoUrl: lec.videoUrl, preview: lec.preview } })}
                                  className="text-gray-500 hover:text-cyan-400 p-1"><FiEdit2 size={12}/></button>
                                <button onClick={() => delLecture(sec._id, lec._id)} className="text-gray-500 hover:text-red-400 p-1"><FiTrash2 size={12}/></button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add lecture form */}
                        <div className="px-4 py-3 bg-gray-800/40">
                          <p className="text-xs text-gray-500 font-medium mb-2">নতুন Lecture যোগ করো</p>
                          <LectureAddForm
                            data={getLecForm(sec._id)}
                            onChange={(patch) => setOneLecForm(sec._id, patch)}
                            onAdd={() => addLecture(sec._id)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add section */}
                <div className="flex gap-2 mt-2">
                  <input value={secForm} onChange={(e) => setSecForm(e.target.value)} placeholder="নতুন section title" className={inp}
                    onKeyDown={(e) => { if (e.key === "Enter") addSection(); }} />
                  <button onClick={addSection} className={addBtn}><FiPlus size={13}/> Section</button>
                </div>
              </div>
            </Section>

            {/* ── FAQ ──────────────────────────────────────────────────────── */}
            <Section icon={FiHelpCircle} title="সচরাচর জিজ্ঞাসা (FAQ)">
              <div className="space-y-2">
                {(detail?.faqs || []).sort((a,b)=>a.order-b.order).map((item) => (
                  <div key={item._id} className="bg-gray-800 rounded-xl px-3 py-2.5 space-y-1">
                    {faqEdit?.id === item._id ? (
                      <FAQEditForm data={faqEdit} onChange={(p) => setFaqEdit((prev) => ({ ...prev, ...p }))}
                        onSave={() => saveFaq(item._id, { question: faqEdit.question, answer: faqEdit.answer })}
                        onCancel={() => setFaqEdit(null)} />
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{item.question}</p>
                          <p className="text-gray-400 text-xs mt-1">{item.answer}</p>
                        </div>
                        <button onClick={() => setFaqEdit({ id: item._id, question: item.question, answer: item.answer })} className="text-gray-500 hover:text-cyan-400 p-1 shrink-0"><FiEdit2 size={12}/></button>
                        <button onClick={() => delFaq(item._id)} className="text-gray-500 hover:text-red-400 p-1 shrink-0"><FiTrash2 size={12}/></button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="space-y-2 mt-2 bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">নতুন FAQ যোগ করো</p>
                  <input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="প্রশ্ন" className={inp} />
                  <textarea rows={2} value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="উত্তর" className={inp + " resize-none"} />
                  <button onClick={addFaq} className={addBtn}><FiPlus size={13}/> Add FAQ</button>
                </div>
              </div>
            </Section>

            {/* ── REVIEWS ──────────────────────────────────────────────────── */}
            <Section icon={FiStar} title="Reviews">
              <div className="space-y-2">
                {(detail?.reviews || []).sort((a,b)=>a.order-b.order).map((item) => (
                  <div key={item._id} className="bg-gray-800 rounded-xl px-3 py-2.5">
                    {revEdit?.id === item._id ? (
                      <ReviewEditForm data={revEdit} onChange={(p) => setRevEdit((prev) => ({ ...prev, ...p }))}
                        onSave={() => saveRev(item._id, { name: revEdit.name, role: revEdit.role, avatarSeed: revEdit.avatarSeed, rating: revEdit.rating, text: revEdit.text })}
                        onCancel={() => setRevEdit(null)} />
                    ) : (
                      <div className="flex items-start gap-2">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatarSeed || item.name}`}
                          className="w-8 h-8 rounded-full shrink-0 bg-gray-700" alt={item.name}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{item.name} <span className="text-yellow-400">{'⭐'.repeat(item.rating)}</span></p>
                          <p className="text-gray-400 text-xs">{item.role}</p>
                          <p className="text-gray-300 text-xs mt-1 line-clamp-2">{item.text}</p>
                        </div>
                        <button onClick={() => setRevEdit({ id: item._id, name: item.name, role: item.role, avatarSeed: item.avatarSeed, rating: item.rating, text: item.text })} className="text-gray-500 hover:text-cyan-400 p-1 shrink-0"><FiEdit2 size={12}/></button>
                        <button onClick={() => delRev(item._id)} className="text-gray-500 hover:text-red-400 p-1 shrink-0"><FiTrash2 size={12}/></button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="space-y-2 mt-2 bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">নতুন Review যোগ করো</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={revForm.name} onChange={(e) => setRevForm({ ...revForm, name: e.target.value })} placeholder="নাম *" className={inp} />
                    <input value={revForm.role} onChange={(e) => setRevForm({ ...revForm, role: e.target.value })} placeholder="পদবী / প্রতিষ্ঠান" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={revForm.avatarSeed} onChange={(e) => setRevForm({ ...revForm, avatarSeed: e.target.value })} placeholder="Avatar seed (নাম দিলেই হবে)" className={inp} />
                    <select value={revForm.rating} onChange={(e) => setRevForm({ ...revForm, rating: Number(e.target.value) })} className={inp}>
                      {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
                    </select>
                  </div>
                  <textarea rows={2} value={revForm.text} onChange={(e) => setRevForm({ ...revForm, text: e.target.value })} placeholder="Review text *" className={inp + " resize-none"} />
                  <button onClick={addRev} className={addBtn}><FiPlus size={13}/> Add Review</button>
                </div>
              </div>
            </Section>

          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Lecture sub-forms ────────────────────────────────────────────────────────
const inp2 = "w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors";

const LectureAddForm = ({ data, onChange, onAdd }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <input value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Lecture title *" className={inp2} />
      <input value={data.duration} onChange={(e) => onChange({ duration: e.target.value })} placeholder="Duration e.g. 14:25" className={inp2} />
    </div>
    <input value={data.videoUrl} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="Video URL (YouTube embed / mp4)" className={inp2} />
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input type="checkbox" checked={data.preview} onChange={(e) => onChange({ preview: e.target.checked })} className="accent-cyan-500" />
        Preview (free)
      </label>
      <button onClick={onAdd} className="flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors">
        <FiPlus size={11}/> Add Lecture
      </button>
    </div>
  </div>
);

const LectureEditForm = ({ data, onChange, onSave, onCancel }) => (
  <div className="space-y-2 py-1">
    <div className="grid grid-cols-2 gap-2">
      <input value={data.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Lecture title" className={inp2} />
      <input value={data.duration} onChange={(e) => onChange({ duration: e.target.value })} placeholder="Duration" className={inp2} />
    </div>
    <input value={data.videoUrl} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="Video URL" className={inp2} />
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input type="checkbox" checked={data.preview} onChange={(e) => onChange({ preview: e.target.checked })} className="accent-cyan-500" />
        Preview (free)
      </label>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex items-center gap-1 text-xs bg-cyan-500 text-gray-950 font-semibold px-3 py-1.5 rounded-lg"><FiSave size={11}/> Save</button>
        <button onClick={onCancel} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">Cancel</button>
      </div>
    </div>
  </div>
);

const FAQEditForm = ({ data, onChange, onSave, onCancel }) => (
  <div className="space-y-2">
    <input value={data.question} onChange={(e) => onChange({ question: e.target.value })} placeholder="প্রশ্ন" className={inp2} />
    <textarea rows={2} value={data.answer} onChange={(e) => onChange({ answer: e.target.value })} placeholder="উত্তর" className={inp2 + " resize-none"} />
    <div className="flex gap-2">
      <button onClick={onSave} className="flex items-center gap-1 text-xs bg-cyan-500 text-gray-950 font-semibold px-3 py-1.5 rounded-lg"><FiSave size={11}/> Save</button>
      <button onClick={onCancel} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">Cancel</button>
    </div>
  </div>
);

const ReviewEditForm = ({ data, onChange, onSave, onCancel }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <input value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="নাম" className={inp2} />
      <input value={data.role} onChange={(e) => onChange({ role: e.target.value })} placeholder="পদবী" className={inp2} />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <input value={data.avatarSeed} onChange={(e) => onChange({ avatarSeed: e.target.value })} placeholder="Avatar seed" className={inp2} />
      <select value={data.rating} onChange={(e) => onChange({ rating: Number(e.target.value) })} className={inp2}>
        {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
      </select>
    </div>
    <textarea rows={2} value={data.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Review text" className={inp2 + " resize-none"} />
    <div className="flex gap-2">
      <button onClick={onSave} className="flex items-center gap-1 text-xs bg-cyan-500 text-gray-950 font-semibold px-3 py-1.5 rounded-lg"><FiSave size={11}/> Save</button>
      <button onClick={onCancel} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg">Cancel</button>
    </div>
  </div>
);

export default AdminCourseDetailModal;
