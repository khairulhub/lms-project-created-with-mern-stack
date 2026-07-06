// client/src/pages/admin/AdminQuizAssignment.jsx
import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiSave, FiChevronDown, FiChevronRight, FiCheck, FiX, FiDownload, FiUpload } from "react-icons/fi";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

// ── Shared styles ──────────────────────────────────────────────────────────
const inp = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10, padding: "9px 13px",
  color: "#fff", fontSize: 13,
  width: "100%", boxSizing: "border-box", outline: "none",
};

// ── uid without ObjectId dependency ───────────────────────────────────────
// Frontend এ শুধু React key হিসেবে ব্যবহার — backend এ পাঠানো হবে না।
let _uid = 0;
const uid = () => `tmp_${++_uid}_${Math.random().toString(36).slice(2)}`;

// Clean করে send — _id গুলো remove করো নতুন item থেকে (tmp_ prefix)
const cleanForSend = (questions) =>
  questions.map(q => ({
    question: q.question,
    order: q.order || 0,
    // tmp_ prefix মানে নতুন — _id না পাঠালে Mongoose নিজেই বানাবে
    ...(q._id && !String(q._id).startsWith("tmp_") ? { _id: q._id } : {}),
    options: q.options.map(o => ({
      text: o.text,
      isCorrect: !!o.isCorrect,
      ...(o._id && !String(o._id).startsWith("tmp_") ? { _id: o._id } : {}),
    })),
  }));

// ════════════════════════════════════════════════════════════════════════════
// Quiz Editor
// ════════════════════════════════════════════════════════════════════════════
const QuizEditor = ({ courseId, section, existingQuiz, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Section Quiz");
  const [passMark, setPassMark] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Sync from existingQuiz whenever it changes
  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title || "Section Quiz");
      setPassMark(existingQuiz.passMark ?? 60);
      setMaxAttempts(existingQuiz.maxAttempts ?? 2);
      setIsActive(existingQuiz.isActive !== false);
      setQuestions(existingQuiz.questions || []);
    } else {
      setTitle("Section Quiz");
      setPassMark(60);
      setMaxAttempts(2);
      setIsActive(true);
      setQuestions([]);
    }
  }, [existingQuiz]);

  const addQuestion = () => setQuestions(prev => [...prev, {
    _id: uid(), question: "", order: prev.length,
    options: [
      { _id: uid(), text: "", isCorrect: true },
      { _id: uid(), text: "", isCorrect: false },
      { _id: uid(), text: "", isCorrect: false },
      { _id: uid(), text: "", isCorrect: false },
    ],
  }]);

  const removeQuestion = (qi) => setQuestions(prev => prev.filter((_, i) => i !== qi));

  const updateQText = (qi, val) => setQuestions(prev => {
    const arr = [...prev];
    arr[qi] = { ...arr[qi], question: val };
    return arr;
  });

  const setCorrect = (qi, oi) => setQuestions(prev => {
    const arr = [...prev];
    arr[qi] = {
      ...arr[qi],
      options: arr[qi].options.map((o, i) => ({ ...o, isCorrect: i === oi })),
    };
    return arr;
  });

  const updateOptText = (qi, oi, val) => setQuestions(prev => {
    const arr = [...prev];
    const opts = [...arr[qi].options];
    opts[oi] = { ...opts[oi], text: val };
    arr[qi] = { ...arr[qi], options: opts };
    return arr;
  });

  const addOption = (qi) => setQuestions(prev => {
    const arr = [...prev];
    arr[qi] = { ...arr[qi], options: [...arr[qi].options, { _id: uid(), text: "", isCorrect: false }] };
    return arr;
  });

  const removeOption = (qi, oi) => setQuestions(prev => {
    const arr = [...prev];
    const opts = arr[qi].options.filter((_, i) => i !== oi);
    arr[qi] = { ...arr[qi], options: opts };
    return arr;
  });

  const save = async () => {
    if (!questions.length) return toast.error("অন্তত একটা question যোগ করো");
    for (const q of questions) {
      if (!q.question.trim()) return toast.error("প্রতিটা question এ text দাও");
      if (!q.options.some(o => o.isCorrect)) return toast.error("প্রতিটা question এ একটা correct answer চিহ্নিত করো");
      if (q.options.some(o => !o.text.trim())) return toast.error("প্রতিটা option এ text দাও");
    }
    setSaving(true);
    try {
      const payload = { title, passMark, maxAttempts, isActive, questions: cleanForSend(questions) };
      const { data } = await api.put(`/admin/quizzes/${courseId}/section/${section._id}`, payload);
      toast.success("Quiz saved! ✓");
      onSaved(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const quickToggle = async () => {
    if (!existingQuiz) return toast.error("আগে quiz save করো");
    try {
      const { data } = await api.patch(`/admin/quizzes/${courseId}/section/${section._id}/toggle`);
      setIsActive(data.isActive);
      onSaved(data);
      toast.success(data.isActive ? "Quiz active করা হলো" : "Quiz inactive করা হলো");
    } catch { toast.error("Toggle failed"); }
  };

  const del = async () => {
    if (!window.confirm("Quiz delete করবে?")) return;
    try {
      await api.delete(`/admin/quizzes/${courseId}/section/${section._id}`);
      toast.success("Deleted");
      setQuestions([]); onSaved(null);
    } catch { toast.error("Delete failed"); }
  };

  const hasQuiz = existingQuiz?.questions?.length > 0;

  return (
    <div style={{ marginTop: 8, borderLeft: "2px solid rgba(124,58,237,0.3)", paddingLeft: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ background: "none", border: "none", color: hasQuiz ? "#a78bfa" : "#6b7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
          {open ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
          🧩 Quiz {hasQuiz ? `(${existingQuiz.questions.length}টা প্রশ্ন)` : "(নেই)"}
        </button>
        {hasQuiz && (
          <button onClick={quickToggle}
            style={{
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", cursor: "pointer",
              background: isActive ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
              border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
              color: isActive ? "#22c55e" : "#9ca3af",
            }}>
            {isActive ? "● Active" : "○ Inactive"}
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="Quiz title" value={title} onChange={e => setTitle(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>Pass %</span>
              <input style={{ ...inp, width: 60 }} type="number" min={0} max={100}
                value={passMark} onChange={e => setPassMark(+e.target.value)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>সর্বোচ্চ attempt</span>
              <input style={{ ...inp, width: 60 }} type="number" min={0}
                value={maxAttempts} onChange={e => setMaxAttempts(+e.target.value)} title="0 = unlimited" />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af", cursor: "pointer", flexShrink: 0 }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
              Active (student দেখবে)
            </label>
          </div>
          <p style={{ color: "#4b5563", fontSize: 10.5, margin: 0 }}>সর্বোচ্চ attempt = 0 দিলে unlimited হবে।</p>

          {/* Questions */}
          {questions.map((q, qi) => (
            <div key={q._id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
              {/* Question text */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(124,58,237,0.2)", color: "#a78bfa", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {qi + 1}
                </div>
                <input style={inp} placeholder={`প্রশ্ন ${qi + 1}`} value={q.question}
                  onChange={e => updateQText(qi, e.target.value)} />
                <button onClick={() => removeQuestion(qi)}
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 10px", cursor: "pointer", flexShrink: 0 }}>
                  <FiTrash2 size={13} />
                </button>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 32 }}>
                <p style={{ color: "#6b7280", fontSize: 11, marginBottom: 2 }}>
                  সবুজ বৃত্তে ক্লিক করো → সেটা <span style={{ color: "#22c55e", fontWeight: 700 }}>Correct Answer</span> হবে
                </p>
                {q.options.map((opt, oi) => (
                  <div key={opt._id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Correct answer toggle */}
                    <button
                      onClick={() => setCorrect(qi, oi)}
                      title={opt.isCorrect ? "Correct answer ✓" : "এটাকে correct answer করো"}
                      style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                        border: `2px solid ${opt.isCorrect ? "#22c55e" : "rgba(255,255,255,0.2)"}`,
                        background: opt.isCorrect ? "#22c55e" : "rgba(255,255,255,0.04)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                      {opt.isCorrect && <FiCheck size={12} color="#fff" />}
                    </button>

                    <input style={inp} placeholder={`Option ${oi + 1}`} value={opt.text}
                      onChange={e => updateOptText(qi, oi, e.target.value)} />

                    {opt.isCorrect && (
                      <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>✓ সঠিক</span>
                    )}

                    {q.options.length > 2 && !opt.isCorrect && (
                      <button onClick={() => removeOption(qi, oi)}
                        style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 2, flexShrink: 0 }}>
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                ))}

                <button onClick={() => addOption(qi)}
                  style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", borderRadius: 8, padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <FiPlus size={11} /> Option যোগ
                </button>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={addQuestion}
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <FiPlus size={13} /> Question যোগ
            </button>
            <button onClick={save} disabled={saving}
              style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: saving ? 0.7 : 1 }}>
              <FiSave size={13} /> {saving ? "Saving..." : "Save Quiz"}
            </button>
            {hasQuiz && (
              <button onClick={del}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <FiTrash2 size={13} /> Delete Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Assignment Editor
// ════════════════════════════════════════════════════════════════════════════
const AssignmentEditor = ({ courseId, moduleIndex, existingAsgn, onSaved, onViewSubmissions }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingAsgn) {
      setForm({
        title: existingAsgn.title || "",
        description: existingAsgn.description || "",
        deadline: existingAsgn.deadline ? existingAsgn.deadline.slice(0, 16) : "",
        isActive: existingAsgn.isActive !== false,
      });
    } else {
      setForm({ title: "", description: "", deadline: "", isActive: true });
    }
  }, [existingAsgn]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title দাও");
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/assignments/${courseId}`, { moduleIndex, ...form });
      toast.success("Assignment saved! ✓");
      onSaved(data);
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const quickToggle = async () => {
    if (!existingAsgn?._id) return toast.error("আগে assignment save করো");
    try {
      const { data } = await api.patch(`/admin/assignments/${existingAsgn._id}/toggle`);
      setForm(f => ({ ...f, isActive: data.isActive }));
      onSaved(data);
      toast.success(data.isActive ? "Assignment active করা হলো" : "Assignment inactive করা হলো");
    } catch { toast.error("Toggle failed"); }
  };

  const del = async () => {
    if (!existingAsgn?._id || !window.confirm("Assignment delete করবে?")) return;
    try {
      await api.delete(`/admin/assignments/${existingAsgn._id}`);
      toast.success("Deleted");
      setForm({ title: "", description: "", deadline: "" });
      onSaved(null);
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div style={{ marginTop: 10, borderLeft: "2px solid rgba(234,179,8,0.3)", paddingLeft: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ background: "none", border: "none", color: existingAsgn ? "#fbbf24" : "#6b7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
          {open ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
          📝 Module Assignment {existingAsgn ? `"${existingAsgn.title}"` : "(নেই)"} <span style={{ color: "#6b7280", fontWeight: 400 }}>(50 mark)</span>
        </button>
        {existingAsgn && (
          <>
            <button onClick={quickToggle}
              style={{
                fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 10px", cursor: "pointer",
                background: form.isActive ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
                border: `1px solid ${form.isActive ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
                color: form.isActive ? "#22c55e" : "#9ca3af",
              }}>
              {form.isActive ? "● Active" : "○ Inactive"}
            </button>
            <button onClick={() => onViewSubmissions(existingAsgn)}
              style={{
                fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 12px", cursor: "pointer",
                background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", color: "#22d3ee",
                display: "flex", alignItems: "center", gap: 4,
              }}>
              👥 {existingAsgn.submissionCount || 0} জন submit করেছে
              {existingAsgn.submissionCount > 0 && existingAsgn.reviewedCount < existingAsgn.submissionCount && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "0 6px", fontSize: 10 }}>
                  {existingAsgn.submissionCount - existingAsgn.reviewedCount} নতুন
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inp} placeholder="Assignment title *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea style={{ ...inp, resize: "vertical", minHeight: 80 }}
            placeholder="বর্ণনা / নির্দেশনা" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>Deadline:</span>
            <input style={inp} type="datetime-local" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#eab308" }} />
            Active (student দেখবে — uncheck করলে এই module এ assignment hide হবে)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving}
              style={{ background: "linear-gradient(90deg,#eab308,#f97316)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: saving ? 0.7 : 1 }}>
              <FiSave size={13} /> {saving ? "Saving..." : "Save Assignment"}
            </button>
            {existingAsgn && (
              <button onClick={del}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <FiTrash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Submissions Modal — admin grading panel for one assignment
// ════════════════════════════════════════════════════════════════════════════
const SubmissionsModal = ({ courseId, assignment, onClose, onGraded }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({}); // subId → { mark, feedback, status }
  const [importing, setImporting] = useState(false);

  const loadSubs = () => {
    setLoading(true);
    api.get(`/admin/assignments/${courseId}/submissions`, { params: { moduleIndex: assignment.moduleIndex } })
      .then(r => {
        setSubs(r.data || []);
        const init = {};
        (r.data || []).forEach(s => {
          init[s._id] = { mark: s.mark ?? "", feedback: s.feedback || "", status: s.status };
        });
        setEditing(init);
      })
      .catch(() => toast.error("Submissions load failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubs(); }, [courseId, assignment]);

  const saveGrade = async (subId) => {
    const e = editing[subId];
    try {
      await api.put(`/admin/submissions/${subId}/review`, {
        mark: e.mark === "" ? null : Number(e.mark),
        feedback: e.feedback,
        status: e.status,
      });
      toast.success("Grade saved!");
      setSubs(prev => prev.map(s => s._id === subId ? { ...s, mark: e.mark === "" ? null : Number(e.mark), feedback: e.feedback, status: e.status } : s));
      onGraded && onGraded();
    } catch { toast.error("Save failed"); }
  };

  // ── Excel Export — সব submission এর Name, Email, Link, Mark, Status, Feedback
  const exportExcel = () => {
    if (!subs.length) return toast.error("কোনো submission নেই export করার মতো");
    const rows = subs.map(s => ({
      Name: s.user?.name || "",
      Email: s.user?.email || "",
      "Student ID": s.user?._id ? `STU-${String(s.user._id).slice(-8).toUpperCase()}` : "",
      Link: s.fileUrl || "",
      Answer: s.answerText || "",
      Mark: s.mark ?? "",
      Status: s.status || "submitted",
      Feedback: s.feedback || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 36 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    const safeTitle = (assignment.title || "assignment").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
    XLSX.writeFile(wb, `${safeTitle}_submissions.xlsx`);
    toast.success("Excel download হয়ে গেছে");
  };

  // ── Excel Import — admin mark বসিয়ে আবার upload করলে bulk update হবে
  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet); // [{ Name, Email, Mark, Status, Feedback, ... }]

      // backend field names এ normalize করো (lowercase keys তৈরি)
      const normalized = rows.map(r => ({
        email: r.Email || r.email || "",
        studentId: r["Student ID"] || r.StudentId || r.studentId || "",
        mark: r.Mark ?? r.mark,
        status: r.Status || r.status,
        feedback: r.Feedback ?? r.feedback ?? "",
      }));

      const { data } = await api.post(`/admin/assignments/${courseId}/bulk-grade`, {
        moduleIndex: assignment.moduleIndex,
        rows: normalized,
      });
      toast.success(`${data.updated}টা submission update হলো${data.skipped ? `, ${data.skipped}টা match হয়নি` : ""}`);
      loadSubs();
      onGraded && onGraded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed — file format ঠিক আছে কিনা দেখো");
    } finally {
      setImporting(false);
      e.target.value = ""; // same file again select করার জন্য reset
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#110224", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
        width: "100%", maxWidth: 820, maxHeight: "85vh", overflowY: "auto", padding: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{assignment.title}</h3>
            <p style={{ color: "#6b7280", fontSize: 12 }}>{subs.length}টা submission · Mark / 50</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={exportExcel}
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <FiDownload size={13} /> Excel Export
            </button>
            <label style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", color: "#22d3ee", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: importing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: importing ? 0.6 : 1 }}>
              <FiUpload size={13} /> {importing ? "Uploading..." : "Excel Import"}
              <input type="file" accept=".xlsx,.xls" onChange={importExcel} disabled={importing} style={{ display: "none" }} />
            </label>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#9ca3af", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
              <FiX size={15} />
            </button>
          </div>
        </div>

        <p style={{ color: "#4b5563", fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
          💡 Excel export করে mark কলামে নাম্বার বসিয়ে (সর্বোচ্চ 50) আবার import করলে সবার mark, status, feedback একসাথে save হয়ে যাবে। Email দিয়ে আগে match করবে, না পেলে Student ID দিয়ে।
        </p>

        {loading ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>লোড হচ্ছে...</div>
        ) : subs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4b5563", padding: 40 }}>এখনো কেউ submit করেনি</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {subs.map(s => (
              <div key={s._id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
                {/* Student info */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <img src={s.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user?.email}`}
                    style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} alt="" />
                  <div>
                    <p style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{s.user?.name}</p>
                    <p style={{ color: "#6b7280", fontSize: 11 }}>{s.user?.email}</p>
                  </div>
                  <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 11 }}>
                    {new Date(s.submittedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Submission content */}
                {s.answerText && (
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, fontSize: 13, color: "#d1d5db", marginBottom: 8, whiteSpace: "pre-wrap" }}>
                    {s.answerText}
                  </div>
                )}
                {s.fileUrl && (
                  <a href={s.fileUrl} target="_blank" rel="noreferrer"
                    style={{ color: "#22d3ee", fontSize: 12, display: "inline-block", marginBottom: 10, textDecoration: "underline" }}>
                    🔗 {s.fileUrl}
                  </a>
                )}

                {/* Grading row */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <input type="number" placeholder="Mark" min={0} max={50} style={{ ...inp, width: 70 }}
                    value={editing[s._id]?.mark ?? ""}
                    onChange={e => {
                      let v = e.target.value;
                      if (v !== "" && Number(v) > 50) v = "50";
                      if (v !== "" && Number(v) < 0) v = "0";
                      setEditing(p => ({ ...p, [s._id]: { ...p[s._id], mark: v } }));
                    }} />
                  <span style={{ color: "#6b7280", fontSize: 11, marginLeft: -6 }}>/ 50</span>
                  <select className="app-select" style={{ ...inp, width: 130 }}
                    value={editing[s._id]?.status || "submitted"}
                    onChange={e => setEditing(p => ({ ...p, [s._id]: { ...p[s._id], status: e.target.value } }))}>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input placeholder="Feedback (optional)" style={{ ...inp, flex: 1, minWidth: 160 }}
                    value={editing[s._id]?.feedback ?? ""}
                    onChange={e => setEditing(p => ({ ...p, [s._id]: { ...p[s._id], feedback: e.target.value } }))} />
                  <button onClick={() => saveGrade(s._id)}
                    style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <FiSave size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
const AdminQuizAssignment = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [curriculum, setCurriculum] = useState([]);
  const [quizMap, setQuizMap] = useState({});
  const [asgnMap, setAsgnMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState(null); // assignment object

  useEffect(() => {
    api.get("/admin/courses").then(r => setCourses(r.data || [])).catch(() => {});
  }, []);

  const loadCourseData = async (courseId) => {
    setLoading(true);
    setCurriculum([]); setQuizMap({}); setAsgnMap({});
    try {
      const [detailRes, quizRes, asgnRes] = await Promise.all([
        api.get(`/admin/course-details/${courseId}`),
        api.get(`/admin/quizzes/${courseId}`),
        api.get(`/admin/assignments/${courseId}`),
      ]);
      setCurriculum(detailRes.data?.curriculum || []);
      const qm = {};
      (quizRes.data || []).forEach(q => { qm[String(q.sectionId)] = q; });
      setQuizMap(qm);
      const am = {};
      (asgnRes.data || []).forEach(a => { am[a.moduleIndex] = a; });
      setAsgnMap(am);
    } catch { toast.error("Data load failed"); }
    finally { setLoading(false); }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    if (courseId) loadCourseData(courseId);
    else { setCurriculum([]); setQuizMap({}); setAsgnMap({}); }
  };

  return (
    <DashboardLayout>
      {/* Global select override — browser default select white bg fix */}
      <style>{`
        select.app-select option {
          background: #1a0533 !important;
          color: #fff !important;
        }
        select.app-select {
          background: rgba(255,255,255,0.06) !important;
          color: #fff !important;
        }
      `}</style>

      <div style={{ maxWidth: 900 }}>
        <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Quiz & Assignment</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
          প্রতিটা section এর শেষে quiz, module এর শেষে assignment সেট করো।
        </p>

        {/* Course selector */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
            Course বেছে নাও
          </label>
          <select
            className="app-select"
            style={{
              ...inp,
              maxWidth: 440,
              cursor: "pointer",
              appearance: "auto",
            }}
            value={selectedCourse}
            onChange={e => handleCourseChange(e.target.value)}
          >
            <option value="" style={{ background: "#1a0533", color: "#9ca3af" }}>-- Course select করো --</option>
            {courses.map(c => (
              <option key={c._id} value={c._id} style={{ background: "#1a0533", color: "#fff" }}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: 48 }}>
            <div style={{ width: 32, height: 32, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            লোড হচ্ছে...
          </div>
        )}

        {/* No curriculum */}
        {!loading && selectedCourse && curriculum.length === 0 && (
          <div style={{ color: "#6b7280", padding: 32, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
            এই course এ এখনো curriculum নেই। আগে curriculum section যোগ করো।
          </div>
        )}

        {/* Prompt */}
        {!selectedCourse && (
          <div style={{ padding: 48, textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16, color: "#4b5563" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🎓</p>
            উপরে course বেছে নাও
          </div>
        )}

        {/* Module list */}
        {!loading && curriculum.map((section, si) => (
          <div key={section._id || si} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px", marginBottom: 16,
          }}>
            {/* Module header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 800,
              }}>
                {si + 1}
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{section.title}</p>
                <p style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                  {section.lectures?.length || 0}টা lecture
                </p>
                {/* Lecture preview */}
                {section.lectures?.slice(0, 3).map((lec, li) => (
                  <p key={li} style={{ color: "#374151", fontSize: 11, marginTop: 2 }}>
                    ▸ {lec.title} {lec.duration && `(${lec.duration})`}
                  </p>
                ))}
                {section.lectures?.length > 3 && (
                  <p style={{ color: "#374151", fontSize: 11, marginTop: 2 }}>
                    ...আরো {section.lectures.length - 3}টা lecture
                  </p>
                )}
              </div>
            </div>

            {/* Quiz + Assignment editors */}
            <div style={{ marginLeft: 42 }}>
              <QuizEditor
                courseId={selectedCourse}
                section={section}
                existingQuiz={quizMap[String(section._id)] || null}
                onSaved={quiz => setQuizMap(m => ({ ...m, [String(section._id)]: quiz }))}
              />
              <AssignmentEditor
                courseId={selectedCourse}
                moduleIndex={si}
                existingAsgn={asgnMap[si] || null}
                onSaved={asgn => setAsgnMap(m => ({ ...m, [si]: asgn }))}
                onViewSubmissions={(asgn) => setViewingSubmissions(asgn)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Submissions/grading modal */}
      {viewingSubmissions && (
        <SubmissionsModal
          courseId={selectedCourse}
          assignment={viewingSubmissions}
          onClose={() => setViewingSubmissions(null)}
          onGraded={() => loadCourseData(selectedCourse)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminQuizAssignment;
