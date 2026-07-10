import { useEffect, useRef, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSend, FiPaperclip, FiX, FiFile, FiDownload } from "react-icons/fi";

const inputCls = "flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none";

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Attachment = ({ a }) => {
  if (a.type === "image") {
    return (
      <a href={a.url} target="_blank" rel="noreferrer" className="block mt-2">
        <img src={a.url} alt={a.name} className="max-w-[220px] max-h-[220px] rounded-lg object-cover border border-gray-700" />
      </a>
    );
  }
  return (
    <a href={a.url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 mt-2 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 hover:border-cyan-600/50 transition-colors max-w-[240px]">
      <FiFile className="text-gray-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-gray-200 text-xs truncate">{a.name || "File"}</p>
        <p className="text-gray-500 text-[10px]">{formatSize(a.size)}</p>
      </div>
      <FiDownload className="text-gray-500 shrink-0 ml-auto" size={14} />
    </a>
  );
};

/**
 * Shared chat thread UI. Kono role-check করে না — parent যা messages দেয় সেটাই দেখায়,
 * onSend কল করলে parent API call করে message পাঠায়।
 *
 * props:
 *  - messages: [{ _id, sender:{_id,name,profileImage}, senderRole, text, attachments, createdAt }]
 *  - currentUserId: string — নিজের message ডান পাশে/অন্য রঙে দেখানোর জন্য
 *  - onSend: async (text, attachments) => void
 *  - disabled: bool — true হলে composer hide (e.g. thread load হয়নি)
 *  - emptyText: string
 */
const ChatThreadView = ({ messages = [], currentUserId, onSend, disabled = false, emptyText = "এখনো কোনো মেসেজ নেই — কথা শুরু করো" }) => {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]); // [{uploading, url, type, name, size}]
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleFilePick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // same file আবার select করলেও change fire হবে
    for (const file of files) {
      const tempId = `${Date.now()}-${file.name}`;
      setPendingFiles((prev) => [...prev, { tempId, uploading: true, name: file.name, size: file.size }]);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/course-chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPendingFiles((prev) => prev.map((f) => f.tempId === tempId ? { ...data, tempId, uploading: false } : f));
      } catch (err) {
        toast.error(err.response?.data?.message || `"${file.name}" আপলোড করা যায়নি`);
        setPendingFiles((prev) => prev.filter((f) => f.tempId !== tempId));
      }
    }
  };

  const removePending = (tempId) => setPendingFiles((prev) => prev.filter((f) => f.tempId !== tempId));

  const submit = async () => {
    const stillUploading = pendingFiles.some((f) => f.uploading);
    if (stillUploading) return toast.error("ফাইল আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করো");
    if (!text.trim() && pendingFiles.length === 0) return;

    setSending(true);
    try {
      const attachments = pendingFiles.map(({ url, type, name, size }) => ({ url, type, name, size }));
      await onSend(text.trim(), attachments);
      setText("");
      setPendingFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Message পাঠানো যায়নি");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-10">{emptyText}</div>
        )}
        {messages.map((m) => {
          const mine = String(m.sender?._id || m.sender) === String(currentUserId);
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-cyan-500/15 rounded-tr-sm" : "bg-gray-800 rounded-tl-sm"}`}>
                {!mine && (
                  <p className="text-gray-400 text-[11px] font-medium mb-1">
                    {m.sender?.name} {m.senderRole === "admin" && "(Admin)"} {m.senderRole === "instructor" && "(Instructor)"}
                  </p>
                )}
                {m.text && <p className="text-gray-100 text-sm whitespace-pre-wrap break-words">{m.text}</p>}
                {m.attachments?.map((a, i) => <Attachment key={i} a={a} />)}
                <p className="text-gray-500 text-[10px] mt-1.5 text-right">
                  {new Date(m.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!disabled && (
        <div className="mt-3 shrink-0">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((f) => (
                <div key={f.tempId} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300">
                  {f.uploading ? (
                    <span className="w-3 h-3 border-2 border-cyan-500/40 border-t-cyan-500 rounded-full animate-spin" />
                  ) : (
                    <FiFile size={12} />
                  )}
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => removePending(f.tempId)} className="text-gray-500 hover:text-red-400"><FiX size={12} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilePick}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv" />
            <button onClick={() => fileInputRef.current?.click()}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-3 rounded-xl transition-colors shrink-0" title="ছবি/ফাইল যোগ করো">
              <FiPaperclip size={16} />
            </button>
            <textarea className={inputCls} rows={1} placeholder="মেসেজ লিখো..."
              value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} />
            <button onClick={submit} disabled={sending}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 p-3 rounded-xl transition-colors shrink-0">
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThreadView;
