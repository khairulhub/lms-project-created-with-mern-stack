// Reserved icon set used by <IconPicker /> — shown to admin whenever they need
// to pick an icon for something (highlight cards, categories, etc.) instead of
// typing a raw emoji by hand. Organized into small groups so the picker can
// show them under labeled tabs/sections.
//
// Each entry is just an emoji string — that's exactly what gets saved to the
// DB in the `icon` field (no extra encoding/lookup needed on the backend).

export const ICON_GROUPS = [
  {
    label: "Learning",
    icons: ["🤖", "📋", "📚", "🎓", "🧠", "📝", "🗂️", "📖", "🔬", "🧩", "🗓️", "🏆"],
  },
  {
    label: "Tech / Stack",
    icons: ["🌐", "💻", "🖥️", "⚙️", "🔌", "🐘", "🛠️", "🧮", "📡", "🔗", "🗄️", "☁️"],
  },
  {
    label: "Career / Support",
    icons: ["💼", "🎯", "🧑‍🏫", "👥", "📈", "🎤", "📁", "🤝", "🏢", "💬", "📞", "✅"],
  },
  {
    label: "General",
    icons: ["🚀", "🔥", "⭐", "💡", "🎉", "🛡️", "📦", "🔒", "⏱️", "🏅", "🎬", "🧪"],
  },
];

// Flat list — handy when something just needs "is this one of our reserved icons"
export const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.icons);
