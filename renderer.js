// 8 Pastel Colors matching Peeky Task palette extracted via REA
const COLOR_MAP = {
  mint:   { bg: "#B9E7D0", edge: "#A4DCC0", name: "Mint" },
  sky:    { bg: "#BAE4E7", edge: "#A5D8DD", name: "Sky" },
  butter: { bg: "#FBE08D", edge: "#F6D272", name: "Butter" },
  peach:  { bg: "#FBD4A8", edge: "#F6C48E", name: "Peach" },
  blush:  { bg: "#F9C9D6", edge: "#F3B6C7", name: "Blush" },
  lilac:  { bg: "#DCC9F2", edge: "#CCB6EA", name: "Lilac" },
  blue:   { bg: "#C2DDF6", edge: "#AFD1F1", name: "Blue" },
  slate:  { bg: "#D9DFE8", edge: "#C8D1DD", name: "Slate" },
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
    title: "Untitled",
    color: "mint",
    body: "- [ ] Brainstorming v1.1 features\n- [ ] Review Windows Store metadata",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 8 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
  {
    id: "n5",
    title: "Side-Project",
    color: "blush",
    body: "- [x] understand architecture\n- [ ] backend api endpoints\n- [ ] database migrations",
    onDeck: true,
    archived: false,
    createdAt: Date.now() - 12 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
];

// App State
let state = {
  notes: [...DEFAULT_NOTES],
  activeNoteId: "n4",
  isCardOpen: false, // Default: rested position until touched/clicked
  edge: "right", // "left" | "right"
};

// Leave Timer matching _leaveTimer in PeekyNotes
let leaveTimer = null;

// Undo Deletion state
let deletedNoteBackup = null;
let undoTimeout = null;

// DOM Elements
const overlayStage = document.getElementById("overlayStage");
const noteCardContainer = document.getElementById("noteCardContainer");
const noteCard = document.getElementById("noteCard");
const cardTitleInput = document.getElementById("cardTitleInput");
const cardSaveStatus = document.getElementById("cardSaveStatus");
const btnMinimizeCard = document.getElementById("btnMinimizeCard");
const btnTuckCard = document.getElementById("btnTuckCard");
const cardProgressBarFill = document.getElementById("cardProgressBarFill");
const cardBodyTextarea = document.getElementById("cardBodyTextarea");
const cardColorSwatches = document.getElementById("cardColorSwatches");
const btnCardDelete = document.getElementById("btnCardDelete");
const btnClearCompleted = document.getElementById("btnClearCompleted");
const btnMarkComplete = document.getElementById("btnMarkComplete");
const btnCloseCard = document.getElementById("btnCloseCard");
const undoDrawer = document.getElementById("undoDrawer");
const btnCardUndo = document.getElementById("btnCardUndo");
const undoBarDrain = document.getElementById("undoBarDrain");

const edgeRail = document.getElementById("edgeRail");
const railTabsTrack = document.getElementById("railTabsTrack");
const btnAddNote = document.getElementById("btnAddNote");
const btnOpenManager = document.getElementById("btnOpenManager");
const btnFlipEdge = document.getElementById("btnFlipEdge");

// Save to disk & broadcast
function persistData() {
  if (window.peekyApi && window.peekyApi.saveData) {
    window.peekyApi.saveData(state);
  }
}

// Get active note
function getActiveNote() {
  return state.notes.find((n) => n.id === state.activeNoteId) || state.notes[0];
}

// Get notes visible on deck
function getDeckNotes() {
  const visible = state.notes.filter((n) => n.onDeck !== false && !n.archived);
  return visible.length > 0 ? visible : state.notes;
}

// Render Rail Tabs
function renderRailTabs() {
  railTabsTrack.innerHTML = "";

  const deckNotes = getDeckNotes();
  deckNotes.forEach((note) => {
    const tab = document.createElement("div");
    tab.className = `rail-tab ${state.isCardOpen && note.id === state.activeNoteId ? "active" : ""}`;
    const colorInfo = COLOR_MAP[note.color] || COLOR_MAP.butter;
    tab.style.backgroundColor = colorInfo.bg;
    tab.title = note.title || "Untitled";

    const lines = (note.body || "").split("\n");
    const total = lines.filter((l) => l.trim().startsWith("- [ ]") || l.trim().startsWith("- [x]")).length;
    const done = lines.filter((l) => l.trim().startsWith("- [x]")).length;
    const isCompleted = total > 0 && done === total;

    const label = document.createElement("span");
    label.className = "rail-tab-label";
    if (isCompleted) {
      label.textContent = "✓ " + (note.title || "Untitled");
    } else if (total > 0) {
      label.textContent = `${note.title || "Untitled"} · ${done}/${total}`;
    } else {
      label.textContent = note.title || "Untitled";
    }

    tab.appendChild(label);

    tab.addEventListener("click", () => {
      if (state.activeNoteId === note.id && state.isCardOpen) {
        // Toggle tuck
        setCardOpenState(false);
      } else {
        state.activeNoteId = note.id;
        setCardOpenState(true);
        renderCard();
      }
      renderRailTabs();
      persistData();
    });

    railTabsTrack.appendChild(tab);
  });
}

// Render Note Card matching Screenshot 5
function renderCard() {
  const activeNote = getActiveNote();
  if (!activeNote) {
    setCardOpenState(false);
    return;
  }

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.mint;

  // Apply note background color
  noteCard.style.backgroundColor = colorInfo.bg;

  // Inputs
  cardTitleInput.value = activeNote.title || "Untitled list";
  cardBodyTextarea.value = activeNote.body || "";

  // Status & Progress
  cardSaveStatus.textContent = "Saved · now";
  updateProgressBadge(activeNote);

  // Active color dot
  const dots = cardColorSwatches.querySelectorAll(".swatch-dot");
  dots.forEach((dot) => {
    if (dot.dataset.color === activeNote.color) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  // Hide undo drawer on note switch
  undoDrawer.style.display = "none";
}

function updateProgressBadge(activeNote) {
  const cardProgressPill = document.getElementById("cardProgressPill");
  if (!cardProgressPill) return;

  if (!activeNote || !activeNote.body) {
    cardProgressPill.style.display = "none";
    if (cardProgressBarFill) cardProgressBarFill.style.width = "0%";
    if (btnMarkComplete) btnMarkComplete.textContent = "Mark all done";
    return;
  }

  const lines = activeNote.body.split("\n");
  const total = lines.filter((l) => l.trim().startsWith("- [ ]") || l.trim().startsWith("- [x]")).length;
  const done = lines.filter((l) => l.trim().startsWith("- [x]")).length;

  if (total > 0) {
    const pct = Math.round((done / total) * 100);
    if (cardProgressBarFill) {
      cardProgressBarFill.style.width = `${pct}%`;
      cardProgressBarFill.style.backgroundColor = done === total ? "#2E7D32" : "#0288D1";
    }

    cardProgressPill.style.display = "inline-block";
    if (done === total) {
      cardProgressPill.style.background = "#2E7D32";
      cardProgressPill.style.color = "#FFFFFF";
      cardProgressPill.textContent = "All done! ✓";
      if (btnMarkComplete) btnMarkComplete.textContent = "Uncheck all";
    } else {
      cardProgressPill.style.background = "rgba(42, 52, 66, 0.12)";
      cardProgressPill.style.color = "var(--note-ink)";
      cardProgressPill.textContent = `${done}/${total} done`;
      if (btnMarkComplete) btnMarkComplete.textContent = "Mark all done";
    }
  } else {
    cardProgressPill.style.display = "none";
    if (cardProgressBarFill) cardProgressBarFill.style.width = "0%";
    if (btnMarkComplete) btnMarkComplete.textContent = "Mark all done";
  }
}

// Toggle or Set Card Open / Tucked state
function setCardOpenState(open) {
  state.isCardOpen = !!open;

  if (state.isCardOpen) {
    edgeRail.classList.remove("rested");
    noteCardContainer.classList.remove("tucked");
    noteCardContainer.style.display = "flex";
  } else {
    noteCardContainer.classList.add("tucked");
    noteCardContainer.style.display = "none";
    // Return to rested position when card is tucked
    edgeRail.classList.add("rested");
  }

  if (window.peekyApi && window.peekyApi.setCardOpen) {
    window.peekyApi.setCardOpen(state.isCardOpen);
  }

  renderRailTabs();
  persistData();
}

// Switch Edge (Left vs Right)
function applyEdge(edge) {
  state.edge = edge;
  document.body.className = `edge-${edge}`;
  btnFlipEdge.textContent = edge === "right" ? "◨" : "◧";
  btnFlipEdge.title = `Flip Screen Edge (Currently ${edge.toUpperCase()} - click to switch)`;
}

// Set up UI listeners
function setupListeners() {
  // HOVER / TOUCH INTERACTION:
  // Rested pill slivers when not touched; fans out tabs & shows 3 buttons when touched
  edgeRail.addEventListener("mouseenter", () => {
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    edgeRail.classList.remove("rested");
    if (!state.isCardOpen && window.peekyApi && window.peekyApi.setDeckHovered) {
      window.peekyApi.setDeckHovered(true);
    }
  });

  edgeRail.addEventListener("mouseleave", () => {
    if (!state.isCardOpen) {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        edgeRail.classList.add("rested");
        if (window.peekyApi && window.peekyApi.setDeckHovered) {
          window.peekyApi.setDeckHovered(false);
        }
      }, 350); // 350ms matching _leaveTimer in REA
    }
  });

  // Title input
  cardTitleInput.addEventListener("input", (e) => {
    const activeNote = getActiveNote();
    if (!activeNote) return;
    activeNote.title = e.target.value;
    activeNote.updatedAt = Date.now();
    cardSaveStatus.textContent = "Saved · now";
    renderRailTabs();
    persistData();
  });

  // Body textarea - auto checklist continuation on Enter, Tab indent
  cardBodyTextarea.addEventListener("keydown", (e) => {
    const textarea = e.target;
    const pos = textarea.selectionStart;
    const text = textarea.value;

    if (e.key === "Tab") {
      e.preventDefault();
      const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
      const lineEnd = text.indexOf("\n", pos);
      const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

      if (e.shiftKey) {
        // Outdent 2 spaces
        if (line.startsWith("  ")) {
          textarea.setRangeText("", lineStart, lineStart + 2, "preserve");
          textarea.dispatchEvent(new Event("input"));
        }
      } else {
        // Indent 2 spaces
        textarea.setRangeText("  ", lineStart, lineStart, "preserve");
        textarea.dispatchEvent(new Event("input"));
      }
      return;
    }

    if (e.key === "Enter") {
      const textBefore = text.substring(0, pos);
      const lastLine = textBefore.split("\n").pop();

      // If user hits Enter on an empty task bullet, clear it and exit list mode
      if (lastLine === "- [ ] " || lastLine === "- [x] ") {
        e.preventDefault();
        const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
        textarea.setRangeText("", lineStart, pos, "end");
        textarea.dispatchEvent(new Event("input"));
        return;
      }
      if (lastLine === "- ") {
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

  cardBodyTextarea.addEventListener("input", (e) => {
    const activeNote = getActiveNote();
    if (!activeNote) return;
    activeNote.body = e.target.value;
    activeNote.updatedAt = Date.now();
    cardSaveStatus.textContent = "Saved · now";
    updateProgressBadge(activeNote);
    renderRailTabs();
    persistData();
  });

  // Click on a checklist item to toggle [ ] <-> [x]
  cardBodyTextarea.addEventListener("click", (e) => {
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

  // Minimize / Tuck / Close Buttons
  btnMinimizeCard.addEventListener("click", () => {
    setCardOpenState(false);
  });

  btnTuckCard.addEventListener("click", () => {
    setCardOpenState(false);
  });

  btnCloseCard.addEventListener("click", () => {
    setCardOpenState(false);
  });

  // Clear completed tasks button
  if (btnClearCompleted) {
    btnClearCompleted.addEventListener("click", () => {
      const activeNote = getActiveNote();
      if (!activeNote) return;

      const lines = (activeNote.body || "").split("\n");
      const remaining = lines.filter((line) => !line.trim().startsWith("- [x] "));
      activeNote.body = remaining.join("\n");
      activeNote.updatedAt = Date.now();

      cardBodyTextarea.value = activeNote.body;
      cardSaveStatus.textContent = "Saved · now";
      updateProgressBadge(activeNote);
      renderRailTabs();
      persistData();
    });
  }

  // Mark all complete / uncheck all button
  btnMarkComplete.addEventListener("click", () => {
    const activeNote = getActiveNote();
    if (!activeNote) return;

    if (activeNote.body.includes("- [ ] ")) {
      activeNote.body = activeNote.body.replace(/- \[ \] /g, "- [x] ");
    } else if (activeNote.body.includes("- [x] ")) {
      activeNote.body = activeNote.body.replace(/- \[x\] /g, "- [ ] ");
    } else {
      activeNote.body += "\n- [x] Completed task";
    }

    cardBodyTextarea.value = activeNote.body;
    activeNote.updatedAt = Date.now();
    cardSaveStatus.textContent = "Saved · now";
    updateProgressBadge(activeNote);
    renderRailTabs();
    persistData();
  });

  // Formatting Buttons on Floating Card
  document.querySelectorAll(".card-fmt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.fmt;
      const textarea = cardBodyTextarea;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);

      let insert = "";
      if (fmt === "bold") insert = `**${selected || "bold"}**`;
      else if (fmt === "italic") insert = `*${selected || "italic"}*`;
      else if (fmt === "underline") insert = `<u>${selected || "text"}</u>`;
      else if (fmt === "strike") insert = `~~${selected || "text"}~~`;
      else if (fmt === "checklist") insert = `\n- [ ] ${selected || "task"}`;
      else if (fmt === "bullets") insert = `\n- ${selected || "item"}`;
      else if (fmt === "numbers") insert = `\n1. ${selected || "item"}`;
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

  // Color swatches click
  cardColorSwatches.addEventListener("click", (e) => {
    const dot = e.target.closest(".swatch-dot");
    if (!dot) return;
    const colorKey = dot.dataset.color;
    if (!COLOR_MAP[colorKey]) return;

    const activeNote = getActiveNote();
    if (!activeNote) return;

    activeNote.color = colorKey;
    activeNote.updatedAt = Date.now();

    renderCard();
    renderRailTabs();
    persistData();
  });

  // Add Task Button (+) matching Screenshot 5
  btnAddNote.addEventListener("click", () => {
    const newNote = {
      id: "task_" + Date.now(),
      title: "Tasks",
      color: "mint", // Cyan/Mint default matching Screenshot 5!
      body: "- [ ] ",
      onDeck: true,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    state.notes.push(newNote);
    state.activeNoteId = newNote.id;
    setCardOpenState(true);
    renderCard();
    renderRailTabs();
    persistData();

    setTimeout(() => {
      cardBodyTextarea.focus();
      cardBodyTextarea.setSelectionRange(6, 6);
    }, 50);
  });

  // Open Manager Window (Grid icon button)
  if (btnOpenManager) {
    btnOpenManager.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openManager) {
        window.peekyApi.openManager();
      }
    });
  }

  // Delete task with 10s undo
  btnCardDelete.addEventListener("click", () => {
    const activeNote = getActiveNote();
    if (!activeNote) return;

    deletedNoteBackup = {
      note: { ...activeNote },
      index: state.notes.findIndex((n) => n.id === activeNote.id),
    };

    undoDrawer.style.display = "flex";
    undoBarDrain.style.transition = "none";
    undoBarDrain.style.width = "100%";
    void undoBarDrain.offsetWidth;

    undoBarDrain.style.transition = "width 10s linear";
    undoBarDrain.style.width = "0%";

    if (undoTimeout) clearTimeout(undoTimeout);

    undoTimeout = setTimeout(() => {
      finalizeDelete();
    }, 10000);
  });

  // Undo button
  btnCardUndo.addEventListener("click", () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    undoDrawer.style.display = "none";
    deletedNoteBackup = null;
  });

  // Flip Edge button
  btnFlipEdge.addEventListener("click", () => {
    const nextEdge = state.edge === "right" ? "left" : "right";
    applyEdge(nextEdge);
    if (window.peekyApi && window.peekyApi.dockEdge) {
      window.peekyApi.dockEdge(nextEdge);
    }
    persistData();
  });

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isCardOpen) {
      setCardOpenState(false);
    }
    if (e.ctrlKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      btnAddNote.click();
    }
    if (e.ctrlKey && e.key === ".") {
      e.preventDefault();
      const activeNote = getActiveNote();
      if (!activeNote) return;
      const curIdx = COLOR_KEYS.indexOf(activeNote.color);
      const nextColor = COLOR_KEYS[(curIdx + 1) % COLOR_KEYS.length];
      activeNote.color = nextColor;
      renderCard();
      renderRailTabs();
      persistData();
    }
  });

  // IPC listeners from Electron main
  if (window.peekyApi && window.peekyApi.onEdgeChanged) {
    window.peekyApi.onEdgeChanged((edge) => {
      applyEdge(edge);
    });
  }

  if (window.peekyApi && window.peekyApi.onDataUpdated) {
    window.peekyApi.onDataUpdated((data) => {
      if (data && data.notes) {
        state.notes = data.notes;
        renderRailTabs();
        renderCard();
      }
    });
  }

  if (window.peekyApi && window.peekyApi.onOpenCard) {
    window.peekyApi.onOpenCard(() => {
      setCardOpenState(true);
      renderCard();
      renderRailTabs();
    });
  }
}

function finalizeDelete() {
  if (!deletedNoteBackup) return;
  const noteId = deletedNoteBackup.note.id;

  state.notes = state.notes.filter((n) => n.id !== noteId);

  if (state.notes.length === 0) {
    state.notes = [
      {
        id: "task_" + Date.now(),
        title: "Untitled note",
        color: "mint",
        body: "- [ ] Add your first task",
        onDeck: true,
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  state.activeNoteId = state.notes[0].id;
  undoDrawer.style.display = "none";
  deletedNoteBackup = null;

  renderCard();
  renderRailTabs();
  persistData();
}

// Initialize
async function init() {
  if (window.peekyApi && window.peekyApi.loadData) {
    try {
      const saved = await window.peekyApi.loadData();
      if (saved && saved.notes && saved.notes.length > 0) {
        state = { ...state, ...saved };
      }
    } catch (e) {
      console.warn("Could not load saved data:", e);
    }
  }

  applyEdge(state.edge || "right");
  setCardOpenState(true); // start with active task card open!
  renderRailTabs();
  renderCard();
  setupListeners();
}

document.addEventListener("DOMContentLoaded", init);
