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
const managerQuickAddInput = document.getElementById("managerQuickAddInput");
const btnManagerQuickAdd = document.getElementById("btnManagerQuickAdd");
const managerTaskItemsContainer = document.getElementById("managerTaskItemsContainer");
const managerActiveTasksGroup = document.getElementById("managerActiveTasksGroup");
const managerCompletedTasksSection = document.getElementById("managerCompletedTasksSection");
const managerCompletedTasksGroup = document.getElementById("managerCompletedTasksGroup");
const btnManagerToggleCompleted = document.getElementById("btnManagerToggleCompleted");
const managerCompletedTitle = document.getElementById("managerCompletedTitle");
const btnManagerClearDone = document.getElementById("btnManagerClearDone");
const btnManagerMarkAll = document.getElementById("btnManagerMarkAll");

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

// Ensure note has structured items
function ensureNoteItems(note) {
  if (!note) return [];
  if (Array.isArray(note.items)) {
    return note.items;
  }
  const items = [];
  const lines = (note.body || "").split("\n");
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const isChecked = trimmed.startsWith("- [x]") || trimmed.startsWith("[x]") || trimmed.startsWith("✓");
    const isUnchecked = trimmed.startsWith("- [ ]") || trimmed.startsWith("[ ]") || trimmed.startsWith("[]");
    let text = trimmed;
    if (isChecked) {
      text = trimmed.replace(/^(-\s*\[x\]|\[x\]|✓)\s*/i, "");
    } else if (isUnchecked) {
      text = trimmed.replace(/^(-\s*\[\s*\]|\[\s*\]|\[\])\s*/i, "");
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      text = trimmed.substring(2);
    } else if (/^\d+\.\s/.test(trimmed)) {
      text = trimmed.replace(/^\d+\.\s/, "");
    }
    items.push({
      id: "item_" + (note.id || "n") + "_" + idx + "_" + Math.random().toString(36).substr(2, 4),
      text: text,
      done: isChecked,
    });
  });
  note.items = items;
  syncNoteBody(note);
  return items;
}

function syncNoteBody(note) {
  if (!note || !Array.isArray(note.items)) return;
  note.body = note.items.map((it) => (it.done ? "- [x] " : "- [ ] ") + (it.text || "")).join("\n");
}

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
    const items = ensureNoteItems(note);
    const total = items.length;
    const done = items.filter((it) => it.done).length;

    // Filter tab
    if (state.currentFilter === "completed") {
      return total > 0 && done === total;
    }
    if (state.currentFilter === "deck" && !note.onDeck) return false;
    if (state.currentFilter === "archive" && !note.archived) return false;
    if (state.currentFilter === "all" && note.archived) return false;

    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = (note.title || "").toLowerCase().includes(q);
      const matchBody = items.some((it) => (it.text || "").toLowerCase().includes(q));
      return matchTitle || matchBody;
    }
    return true;
  });
}

function getTaskProgress(note) {
  const items = ensureNoteItems(note);
  const total = items.length;
  const done = items.filter((it) => it.done).length;
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
    const items = ensureNoteItems(note);
    const firstTaskText = items[0]?.text || "No tasks";
    const progress = getTaskProgress(note);
    snippet.textContent = `${progress}${firstTaskText}`;

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
    if (managerActiveTasksGroup) managerActiveTasksGroup.innerHTML = "";
    return;
  }

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.butter;
  noteEditorPane.style.backgroundColor = colorInfo.bg;

  editorTitleInput.value = activeNote.title || "";
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
  const items = ensureNoteItems(activeNote);
  const total = items.length;
  const done = items.filter((it) => it.done).length;

  if (managerProgressPill) {
    if (total > 0) {
      managerProgressPill.style.display = "inline-block";
      if (done === total) {
        managerProgressPill.style.background = "#2E7D32";
        managerProgressPill.style.color = "#FFFFFF";
        managerProgressPill.textContent = "All done! ✓";
        if (btnManagerMarkAll) btnManagerMarkAll.textContent = "Uncheck all";
      } else {
        managerProgressPill.style.background = "rgba(42, 52, 66, 0.12)";
        managerProgressPill.style.color = "var(--note-ink)";
        managerProgressPill.textContent = `${done}/${total} done`;
        if (btnManagerMarkAll) btnManagerMarkAll.textContent = "Mark all done";
      }
    } else {
      managerProgressPill.style.display = "none";
      if (btnManagerMarkAll) btnManagerMarkAll.textContent = "Mark all done";
    }
  }

  renderManagerTaskItems(activeNote);
}

function renderManagerTaskItems(activeNote) {
  if (!managerActiveTasksGroup || !managerCompletedTasksGroup) return;

  managerActiveTasksGroup.innerHTML = "";
  managerCompletedTasksGroup.innerHTML = "";

  const items = ensureNoteItems(activeNote);
  const activeItems = items.filter((it) => !it.done);
  const completedItems = items.filter((it) => it.done);

  if (items.length === 0) {
    managerActiveTasksGroup.innerHTML = `<div class="empty-tasks-placeholder">No tasks yet. Use the input above to add your first task!</div>`;
  } else {
    activeItems.forEach((item) => {
      managerActiveTasksGroup.appendChild(createManagerTaskRow(item, activeNote));
    });
  }

  if (completedItems.length > 0) {
    managerCompletedTasksSection.style.display = "block";
    managerCompletedTitle.textContent = `Completed (${completedItems.length})`;
    completedItems.forEach((item) => {
      managerCompletedTasksGroup.appendChild(createManagerTaskRow(item, activeNote));
    });
  } else {
    managerCompletedTasksSection.style.display = "none";
  }
}

function createManagerTaskRow(item, note) {
  const row = document.createElement("div");
  row.className = `task-item-row ${item.done ? "completed" : ""}`;
  row.dataset.id = item.id;

  const checkbox = document.createElement("button");
  checkbox.type = "button";
  checkbox.className = "task-checkbox";
  checkbox.title = item.done ? "Mark as to-do" : "Mark as completed";
  checkbox.innerHTML = `
    <svg class="check-icon" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  checkbox.addEventListener("click", (e) => {
    e.stopPropagation();
    item.done = !item.done;
    note.updatedAt = Date.now();
    syncNoteBody(note);
    renderEditor();
    renderNotesList();
    persistData();
  });

  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-text-input";
  input.value = item.text || "";
  input.placeholder = "Task description...";

  input.addEventListener("input", (e) => {
    item.text = e.target.value;
    note.updatedAt = Date.now();
    syncNoteBody(note);
    persistData();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const items = ensureNoteItems(note);
      const currentIndex = items.findIndex((it) => it.id === item.id);
      const newItem = {
        id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        text: "",
        done: false,
      };
      items.splice(currentIndex + 1, 0, newItem);
      note.updatedAt = Date.now();
      syncNoteBody(note);
      renderEditor();
      renderNotesList();
      persistData();

      setTimeout(() => {
        const nextRow = document.querySelector(`.task-item-row[data-id="${newItem.id}"] .task-text-input`);
        if (nextRow) nextRow.focus();
      }, 20);
    } else if (e.key === "Backspace" && input.value === "") {
      e.preventDefault();
      const items = ensureNoteItems(note);
      const currentIndex = items.findIndex((it) => it.id === item.id);
      if (items.length > 1) {
        items.splice(currentIndex, 1);
        note.updatedAt = Date.now();
        syncNoteBody(note);
        renderEditor();
        renderNotesList();
        persistData();

        const prevIndex = Math.max(0, currentIndex - 1);
        const prevItem = items[prevIndex];
        if (prevItem) {
          setTimeout(() => {
            const prevRow = document.querySelector(`.task-item-row[data-id="${prevItem.id}"] .task-text-input`);
            if (prevRow) {
              prevRow.focus();
              prevRow.setSelectionRange(prevRow.value.length, prevRow.value.length);
            }
          }, 20);
        }
      } else {
        items.splice(0, 1);
        note.updatedAt = Date.now();
        syncNoteBody(note);
        renderEditor();
        renderNotesList();
        persistData();
        if (managerQuickAddInput) managerQuickAddInput.focus();
      }
    } else if (e.key === "ArrowDown") {
      const next = row.nextElementSibling?.querySelector(".task-text-input");
      if (next) {
        e.preventDefault();
        next.focus();
      }
    } else if (e.key === "ArrowUp") {
      const prev = row.previousElementSibling?.querySelector(".task-text-input");
      if (prev) {
        e.preventDefault();
        prev.focus();
      } else if (managerQuickAddInput) {
        e.preventDefault();
        managerQuickAddInput.focus();
      }
    }
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "task-row-del-btn";
  delBtn.title = "Delete task";
  delBtn.textContent = "✕";

  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const items = ensureNoteItems(note);
    note.items = items.filter((it) => it.id !== item.id);
    note.updatedAt = Date.now();
    syncNoteBody(note);
    renderEditor();
    renderNotesList();
    persistData();
  });

  row.appendChild(checkbox);
  row.appendChild(input);
  row.appendChild(delBtn);

  return row;
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

  // Manager Quick Add Task
  function handleManagerQuickAdd() {
    if (!managerQuickAddInput) return;
    const text = managerQuickAddInput.value.trim();
    if (!text) return;

    const note = getActiveNote();
    if (!note) return;

    const items = ensureNoteItems(note);
    const newItem = {
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: text,
      done: false,
    };
    items.push(newItem);
    note.updatedAt = Date.now();
    syncNoteBody(note);

    managerQuickAddInput.value = "";
    renderEditor();
    renderNotesList();
    persistData();
    managerQuickAddInput.focus();
  }

  if (managerQuickAddInput) {
    managerQuickAddInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleManagerQuickAdd();
      } else if (e.key === "ArrowDown") {
        const firstInput = managerActiveTasksGroup?.querySelector(".task-text-input");
        if (firstInput) {
          e.preventDefault();
          firstInput.focus();
        }
      }
    });
  }

  if (btnManagerQuickAdd) {
    btnManagerQuickAdd.addEventListener("click", () => {
      if (managerQuickAddInput && managerQuickAddInput.value.trim()) {
        handleManagerQuickAdd();
      } else if (managerQuickAddInput) {
        managerQuickAddInput.focus();
      }
    });
  }

  // Toggle Completed section in Manager
  if (btnManagerToggleCompleted && managerCompletedTasksSection) {
    btnManagerToggleCompleted.addEventListener("click", () => {
      managerCompletedTasksSection.classList.toggle("collapsed");
    });
  }

  // Clear Done button in Manager
  if (btnManagerClearDone) {
    btnManagerClearDone.addEventListener("click", () => {
      const note = getActiveNote();
      if (!note) return;
      const items = ensureNoteItems(note);
      note.items = items.filter((it) => !it.done);
      note.updatedAt = Date.now();
      syncNoteBody(note);
      renderEditor();
      renderNotesList();
      persistData();
    });
  }

  // Mark all / uncheck all button in Manager
  if (btnManagerMarkAll) {
    btnManagerMarkAll.addEventListener("click", () => {
      const note = getActiveNote();
      if (!note) return;
      const items = ensureNoteItems(note);
      const hasUncompleted = items.some((it) => !it.done);
      items.forEach((it) => {
        it.done = hasUncompleted;
      });
      note.updatedAt = Date.now();
      syncNoteBody(note);
      renderEditor();
      renderNotesList();
      persistData();
    });
  }

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

  // Delete task list
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
            items: [
              { id: "item_" + Date.now() + "_1", text: "Add your first task", done: false }
            ],
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
    const items = ensureNoteItems(note);
    const lines = items.map((it) => `${it.done ? "- [x]" : "- [ ]"} ${it.text}`).join("\n");
    const md = `# ${note.title}\n\n${lines}\n`;
    navigator.clipboard.writeText(md).then(() => {
      alert("Task list copied to clipboard as markdown!");
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
