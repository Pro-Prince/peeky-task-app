// 8 Pastel Colors matching Peeky Task palette extracted via REA
const COLOR_MAP = {
  butter: { bg: "#FBE08D", name: "Butter" },
  blue:   { bg: "#C2DDF6", name: "Blue" },
  mint:   { bg: "#B9E7D0", name: "Mint" },
  blush:  { bg: "#F9C9D6", name: "Blush" },
  lilac:  { bg: "#DCC9F2", name: "Lilac" },
  peach:  { bg: "#FBD4A8", name: "Peach" },
  sky:    { bg: "#BAE4E7", name: "Sky" },
  slate:  { bg: "#D9DFE8", name: "Slate" },
};

const COLOR_KEYS = Object.keys(COLOR_MAP);

// Initial default tasks matching screenshot
const DEFAULT_NOTES = [
  {
    id: "n1",
    title: "Groceries",
    color: "butter",
    body: "- [x] oat milk\n- [ ] rye bread\n- [ ] coffee, the good one",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 5 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
  {
    id: "n2",
    title: "Today",
    color: "blue",
    body: "- [x] reply to Sam\n- [ ] book the thing\n- [ ] 6pm: call mum",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 4 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
  {
    id: "n3",
    title: "Ideas",
    color: "lilac",
    body: "- drag a note to the other edge\n- try the dark theme\n- add custom tag colors\n- Alt+Space to toggle",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 6 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
  {
    id: "n4",
    title: "Untitled task",
    color: "mint",
    body: "- [ ] Brainstorming v1.1 features\n- [ ] Review Windows Store metadata",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 8 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
  {
    id: "n5",
    title: "Side-projects",
    color: "blush",
    body: "- [x] understand architecture\n- [ ] backend api endpoints\n- [ ] database migrations",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 12 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
];

let state = {
  notes: [...DEFAULT_NOTES],
  activeNoteId: "n1",
  currentFilter: "all", // "all" | "deck" | "archive"
  searchQuery: "",
  trial: {
    isLicensed: false,
    licenseKey: "",
  },
};

// DOM Elements
const notesListContainer = document.getElementById("notesListContainer");
const notesCountBadge = document.getElementById("notesCountBadge");
const notesListTitle = document.getElementById("notesListTitle");
const searchInput = document.getElementById("searchInput");
const btnNewNotePrimary = document.getElementById("btnNewNotePrimary");
const btnSortNotes = document.getElementById("btnSortNotes");

const navAllNotes = document.getElementById("navAllNotes");
const navOnDeck = document.getElementById("navOnDeck");
const navArchive = document.getElementById("navArchive");

const noteEditorPane = document.getElementById("noteEditorPane");
const editorTitleInput = document.getElementById("editorTitleInput");
const editorBodyTextarea = document.getElementById("editorBodyTextarea");
const editorMetaTime = document.getElementById("editorMetaTime");
const editorDateStamp = document.getElementById("editorDateStamp");
const deckStatusBadge = document.getElementById("deckStatusBadge");
const btnToggleDeck = document.getElementById("btnToggleDeck");
const btnExportNote = document.getElementById("btnExportNote");
const btnDeleteNote = document.getElementById("btnDeleteNote");
const paletteDots = document.getElementById("paletteDots");

const btnEnterKey = document.getElementById("btnEnterKey");
const btnBuyNotes = document.getElementById("btnBuyNotes");
const licenseModal = document.getElementById("licenseModal");
const inputLicenseKey = document.getElementById("inputLicenseKey");
const btnCancelLicense = document.getElementById("btnCancelLicense");
const btnConfirmLicense = document.getElementById("btnConfirmLicense");

function formatRelativeTime(ts) {
  if (!ts) return "edited just now";
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "edited just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `edited ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `edited ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `edited ${diffDays}d`;
}

function formatDate(ts) {
  if (!ts) ts = Date.now();
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function persistData() {
  if (window.peekyApi && window.peekyApi.saveData) {
    window.peekyApi.saveData(state);
  }
}

function getActiveNote() {
  return state.notes.find((n) => n.id === state.activeNoteId) || state.notes[0];
}

function getFilteredNotes() {
  return state.notes.filter((note) => {
    // Filter tab
    if (state.currentFilter === "completed") {
      const lines = (note.body || "").split("\n");
      const total = lines.filter((l) => l.trim().startsWith("- [ ]") || l.trim().startsWith("- [x]")).length;
      const done = lines.filter((l) => l.trim().startsWith("- [x]")).length;
      return total > 0 && done === total;
    }
    if (state.currentFilter === "deck" && !note.onDeck) return false;
    if (state.currentFilter === "archive" && !note.archived) return false;
    if (state.currentFilter === "all" && note.archived) return false;

    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = (note.title || "").toLowerCase().includes(q);
      const matchBody = (note.body || "").toLowerCase().includes(q);
      return matchTitle || matchBody;
    }
    return true;
  });
}

function getTaskProgress(body) {
  if (!body) return "";
  const lines = body.split("\n");
  const total = lines.filter((l) => l.trim().startsWith("- [ ]") || l.trim().startsWith("- [x]")).length;
  const done = lines.filter((l) => l.trim().startsWith("- [x]")).length;
  if (total > 0) {
    return `${done}/${total} done · `;
  }
  return "";
}

function renderNotesList() {
  const list = getFilteredNotes();
  notesCountBadge.textContent = list.length;
  notesListContainer.innerHTML = "";

  list.forEach((note) => {
    const item = document.createElement("div");
    item.className = `note-list-item ${note.id === state.activeNoteId ? "active" : ""}`;

    const colorDot = document.createElement("span");
    colorDot.className = "item-color-dot";
    colorDot.style.backgroundColor = (COLOR_MAP[note.color] || COLOR_MAP.butter).bg;

    const info = document.createElement("div");
    info.className = "item-info";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = note.title || "Untitled task";

    const snippet = document.createElement("div");
    snippet.className = "item-snippet";
    const firstLine = (note.body || "").replace(/- \[[ x]\] /g, "").replace(/\n/g, " ").trim();
    const progress = getTaskProgress(note.body);
    snippet.textContent = `3h  ${progress}${firstLine || "No content"}`;

    info.appendChild(title);
    info.appendChild(snippet);

    item.appendChild(colorDot);
    item.appendChild(info);

    item.addEventListener("click", () => {
      state.activeNoteId = note.id;
      renderNotesList();
      renderEditor();
      persistData();
    });

    notesListContainer.appendChild(item);
  });
}

function renderEditor() {
  const activeNote = getActiveNote();
  if (!activeNote) {
    editorTitleInput.value = "";
    editorBodyTextarea.value = "";
    return;
  }

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.butter;
  noteEditorPane.style.backgroundColor = colorInfo.bg;

  editorTitleInput.value = activeNote.title || "";
  editorBodyTextarea.value = activeNote.body || "";
  editorMetaTime.textContent = formatRelativeTime(activeNote.updatedAt);
  editorDateStamp.textContent = `Created ${formatDate(activeNote.createdAt)} · Updated ${formatRelativeTime(activeNote.updatedAt)}`;

  // Update deck badge
  const dot = deckStatusBadge.querySelector(".status-indicator-dot");
  const label = deckStatusBadge.querySelector(".status-indicator-label");
  if (activeNote.onDeck !== false) {
    dot.style.background = "#2E7D32";
    label.textContent = "Active · on the deck";
  } else {
    dot.style.background = "#8E9BAE";
    label.textContent = "Docked off · click to pin to deck";
  }

  // Update active color dot
  const dots = paletteDots.querySelectorAll(".palette-dot");
  dots.forEach((d) => {
    if (d.dataset.color === activeNote.color) {
      d.classList.add("active");
    } else {
      d.classList.remove("active");
    }
  });

  // Update progress badge
  const managerProgressPill = document.getElementById("managerProgressPill");
  if (managerProgressPill) {
    const lines = (activeNote.body || "").split("\n");
    const total = lines.filter((l) => l.trim().startsWith("- [ ]") || l.trim().startsWith("- [x]")).length;
    const done = lines.filter((l) => l.trim().startsWith("- [x]")).length;
    if (total > 0) {
      managerProgressPill.style.display = "inline-block";
      if (done === total) {
        managerProgressPill.style.background = "#2E7D32";
        managerProgressPill.style.color = "#FFFFFF";
        managerProgressPill.textContent = "All done! ✓";
      } else {
        managerProgressPill.style.background = "rgba(42, 52, 66, 0.12)";
        managerProgressPill.style.color = "var(--note-ink)";
        managerProgressPill.textContent = `${done}/${total} done`;
      }
    } else {
      managerProgressPill.style.display = "none";
    }
  }
}

function setupListeners() {
  // Navigation filters
  const navCompleted = document.getElementById("navCompleted");
  const navBtns = [navAllNotes, navOnDeck, navCompleted, navArchive].filter(Boolean);
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;

      if (state.currentFilter === "all") notesListTitle.textContent = "All tasks";
      else if (state.currentFilter === "deck") notesListTitle.textContent = "On the deck";
      else if (state.currentFilter === "completed") notesListTitle.textContent = "Completed tasks";
      else if (state.currentFilter === "archive") notesListTitle.textContent = "Archive";

      renderNotesList();
    });
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    renderNotesList();
  });

  // Add new task
  btnNewNotePrimary.addEventListener("click", () => {
    const usedColors = state.notes.map((n) => n.color);
    const unused = COLOR_KEYS.find((c) => !usedColors.includes(c)) || COLOR_KEYS[state.notes.length % COLOR_KEYS.length];

    const newNote = {
      id: "task_" + Date.now(),
      title: "New task",
      color: unused,
      body: "- [ ] ",
      onDeck: true,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    state.notes.unshift(newNote);
    state.activeNoteId = newNote.id;
    renderNotesList();
    renderEditor();
    persistData();

    editorTitleInput.focus();
    editorTitleInput.select();
  });

  // Title editor
  editorTitleInput.addEventListener("input", (e) => {
    const note = getActiveNote();
    if (!note) return;
    note.title = e.target.value;
    note.updatedAt = Date.now();
    editorMetaTime.textContent = "edited just now";
    renderNotesList();
    persistData();
  });

  // Body editor with auto-continuation for checklist items
  editorBodyTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const textarea = e.target;
      const pos = textarea.selectionStart;
      const text = textarea.value;
      const textBefore = text.substring(0, pos);
      const lastLine = textBefore.split("\n").pop();

      // If user hits Enter on an empty checklist item, clean it and exit list mode
      if (lastLine === "- [ ] " || lastLine === "- [x] ") {
        e.preventDefault();
        const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
        textarea.setRangeText("", lineStart, pos, "end");
        textarea.dispatchEvent(new Event("input"));
        return;
      }

      if (lastLine.startsWith("- [ ] ") || lastLine.startsWith("- [x] ")) {
        e.preventDefault();
        const nextTask = "\n- [ ] ";
        textarea.setRangeText(nextTask, pos, pos, "end");
        textarea.dispatchEvent(new Event("input"));
      } else if (/^\d+\.\s/.test(lastLine)) {
        e.preventDefault();
        const num = parseInt(lastLine.match(/^(\d+)\./)[1], 10);
        const nextNum = `\n${num + 1}. `;
        textarea.setRangeText(nextNum, pos, pos, "end");
        textarea.dispatchEvent(new Event("input"));
      } else if (lastLine.startsWith("- ")) {
        e.preventDefault();
        const nextBullet = "\n- ";
        textarea.setRangeText(nextBullet, pos, pos, "end");
        textarea.dispatchEvent(new Event("input"));
      }
    }
  });

  // Click on a checklist item to toggle [ ] <-> [x]
  editorBodyTextarea.addEventListener("click", (e) => {
    const textarea = e.target;
    const pos = textarea.selectionStart;
    const text = textarea.value;
    const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = text.indexOf("\n", pos);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

    // If click is within the checkbox [- [ ] or - [x]]
    const col = pos - lineStart;
    if (col <= 6 && (line.startsWith("- [ ] ") || line.startsWith("- [x] "))) {
      const newLine = line.startsWith("- [ ] ")
        ? line.replace("- [ ] ", "- [x] ")
        : line.replace("- [x] ", "- [ ] ");

      const before = text.substring(0, lineStart);
      const after = text.substring(lineEnd === -1 ? text.length : lineEnd);
      textarea.value = before + newLine + after;
      textarea.setSelectionRange(pos, pos);
      textarea.dispatchEvent(new Event("input"));
    }
  });

  editorBodyTextarea.addEventListener("input", (e) => {
    const note = getActiveNote();
    if (!note) return;
    note.body = e.target.value;
    note.updatedAt = Date.now();
    editorMetaTime.textContent = "edited just now";
    renderEditor();
    renderNotesList();
    persistData();
  });

  // Deck pin toggle
  btnToggleDeck.addEventListener("click", () => {
    const note = getActiveNote();
    if (!note) return;
    note.onDeck = !note.onDeck;
    renderEditor();
    renderNotesList();
    persistData();
  });

  deckStatusBadge.addEventListener("click", () => {
    btnToggleDeck.click();
  });

  // Delete task
  btnDeleteNote.addEventListener("click", () => {
    const note = getActiveNote();
    if (!note) return;
    if (confirm(`Delete "${note.title || 'Untitled'}"?`)) {
      state.notes = state.notes.filter((n) => n.id !== note.id);
      if (state.notes.length === 0) {
        state.notes = [
          {
            id: "task_" + Date.now(),
            title: "Daily Tasks",
            color: "butter",
            body: "- [ ] Add your first task",
            onDeck: true,
            archived: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      }
      state.activeNoteId = state.notes[0].id;
      renderNotesList();
      renderEditor();
      persistData();
    }
  });

  // Color Palette Dots
  paletteDots.addEventListener("click", (e) => {
    const dot = e.target.closest(".palette-dot");
    if (!dot) return;
    const colorKey = dot.dataset.color;
    if (!COLOR_MAP[colorKey]) return;

    const note = getActiveNote();
    if (!note) return;
    note.color = colorKey;
    note.updatedAt = Date.now();

    renderEditor();
    renderNotesList();
    persistData();
  });

  // Export note as Markdown
  btnExportNote.addEventListener("click", () => {
    const note = getActiveNote();
    if (!note) return;
    const md = `# ${note.title}\n\n${note.body}\n`;
    navigator.clipboard.writeText(md).then(() => {
      alert("Task markdown copied to clipboard!");
    });
  });

  // Formatting Toolbar Buttons
  document.querySelectorAll(".fmt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.format;
      const textarea = editorBodyTextarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);

      let insert = "";
      if (fmt === "bold") insert = `**${selected || "bold text"}**`;
      else if (fmt === "italic") insert = `*${selected || "italic text"}*`;
      else if (fmt === "underline") insert = `<u>${selected || "underlined text"}</u>`;
      else if (fmt === "strike") insert = `~~${selected || "strikethrough text"}~~`;
      else if (fmt === "checklist") insert = `\n- [ ] ${selected || "New task"}`;
      else if (fmt === "bullets") insert = `\n- ${selected || "bullet item"}`;
      else if (fmt === "link") insert = `[${selected || "title"}](https://)`;
      else if (fmt === "font") {
        textarea.style.fontFamily = textarea.style.fontFamily.includes("Segoe UI")
          ? "'Segoe Print', 'Ink Free', sans-serif"
          : "-apple-system, 'Segoe UI', Roboto, sans-serif";
        return;
      }

      textarea.setRangeText(insert, start, end, "end");
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });
  });

  // About Button opens Onboarding Walkthrough
  const btnSidebarAbout = document.getElementById("btnSidebarAbout");
  if (btnSidebarAbout) {
    btnSidebarAbout.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openOnboarding) {
        window.peekyApi.openOnboarding();
      }
    });
  }

  // Buy Peeky Task
  btnBuyNotes.addEventListener("click", () => {
    if (window.peekyApi && window.peekyApi.openExternal) {
      window.peekyApi.openExternal("https://peekytask.in/buy");
    }
  });

  // Enter Key
  btnEnterKey.addEventListener("click", () => {
    licenseModal.style.display = "flex";
    inputLicenseKey.focus();
  });

  btnCancelLicense.addEventListener("click", () => {
    licenseModal.style.display = "none";
  });

  btnConfirmLicense.addEventListener("click", () => {
    const key = inputLicenseKey.value.trim();
    if (key.length >= 8) {
      state.trial.isLicensed = true;
      state.trial.licenseKey = key;
      persistData();
      alert("License activated successfully! Thank you for purchasing Peeky Task.");
      licenseModal.style.display = "none";
      const banner = document.getElementById("trialBanner");
      if (banner) banner.style.display = "none";
    } else {
      alert("Please enter a valid license key.");
    }
  });

  // Real-time synchronization with Deck Window
  if (window.peekyApi && window.peekyApi.onDataUpdated) {
    window.peekyApi.onDataUpdated((data) => {
      if (data && data.notes) {
        state.notes = data.notes;
        renderNotesList();
        renderEditor();
      }
    });
  }
}

async function init() {
  if (window.peekyApi && window.peekyApi.loadData) {
    try {
      const saved = await window.peekyApi.loadData();
      if (saved && saved.notes && saved.notes.length > 0) {
        state = { ...state, ...saved };
      }
    } catch (e) {
      console.warn("Could not load saved data in Manager:", e);
    }
  }

  setupListeners();
  renderNotesList();
  renderEditor();

  if (state.trial && state.trial.isLicensed) {
    const banner = document.getElementById("trialBanner");
    if (banner) banner.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", init);
