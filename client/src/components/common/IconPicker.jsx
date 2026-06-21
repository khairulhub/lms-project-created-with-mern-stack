import { useEffect, useRef, useState } from "react";
import { ICON_GROUPS } from "../../utils/iconLibrary";

// Reusable icon picker — shows the currently chosen emoji as a button;
// clicking it opens a small popover grid of reserved icons grouped by
// category. Used anywhere admin needs to pick an icon (highlight cards,
// categories, etc.) instead of typing a raw emoji into a text box.
//
// Props:
//   value     — current icon (emoji string)
//   onChange  — (newIcon) => void
const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-gray-800 border border-gray-700 hover:border-cyan-500 text-white rounded-xl px-3 py-2.5 text-center text-2xl transition-colors"
        title="Icon select koro"
      >
        {value || "🤖"}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 max-h-80 overflow-y-auto left-0">
          {ICON_GROUPS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="text-gray-500 text-xs font-medium mb-1.5">{group.label}</p>
              <div className="grid grid-cols-6 gap-1.5">
                {group.icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => { onChange(ic); setOpen(false); }}
                    className={`text-xl p-1.5 rounded-lg transition-colors hover:bg-gray-800 ${
                      value === ic ? "bg-cyan-500/20 border border-cyan-500/40" : "border border-transparent"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
