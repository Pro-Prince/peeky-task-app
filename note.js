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
  trial: {},
  font: "handwritten",
};

let deletedNoteBackup = null;
let undoTimeout = null;

// DOM Elements
const noteCard = document.getElementById("noteCard");
const cardTitleInput = document.getElementById("cardTitleInput");
const cardSaveStatus = document.getElementById("cardSaveStatus");
const cardProgressPill = document.getElementById("cardProgressPill");
const cardProgressBarFill = document.getElementById("cardProgressBarFill");
const quickAddInput = document.getElementById("quickAddInput");
const btnQuickAddIcon = document.getElementById("btnQuickAddIcon");
const activeTasksGroup = document.getElementById("activeTasksGroup");
const completedTasksSection = document.getElementById("completedTasksSection");
const completedTasksGroup = document.getElementById("completedTasksGroup");
const btnToggleCompleted = document.getElementById("btnToggleCompleted");
const completedSectionTitle = document.getElementById("completedSectionTitle");
const cardColorSwatches = document.getElementById("cardColorSwatches");
const btnCardDelete = document.getElementById("btnCardDelete");
const btnMarkComplete = document.getElementById("btnMarkComplete");
const btnCloseCard = document.getElementById("btnCloseCard");
const btnBottomClose = document.getElementById("btnBottomClose");
const btnMinimizeCard = document.getElementById("btnMinimizeCard");
const undoDrawer = document.getElementById("undoDrawer");
const btnCardUndo = document.getElementById("btnCardUndo");
const undoBarDrain = document.getElementById("undoBarDrain");

function getActiveNote() {
  if (!state.notes || state.notes.length === 0) return null;
  const found = state.notes.find((n) => n.id === state.activeNoteId);
  if (found) return found;
  return state.notes[0];
}

function ensureNoteItems(note) {
  if (!note) return [];
  if (Array.isArray(note.items)) return note.items;
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

function persistData() {
  if (window.peekyApi && window.peekyApi.saveData) {
    window.peekyApi.saveData(state);
  }
}

function renderCard() {
  const activeNote = getActiveNote();
  if (!activeNote) return;

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.mint;
  noteCard.style.backgroundColor = colorInfo.bg;

  cardTitleInput.value = activeNote.title || "Untitled list";
  if (isEditingLocked()) {
    cardTitleInput.readOnly = true;
    if (quickAddInput) quickAddInput.placeholder = "Trial expired · Editing is locked";
  } else {
    cardTitleInput.readOnly = false;
    if (quickAddInput) quickAddInput.placeholder = "Add a task... (press Enter)";
  }
  cardSaveStatus.textContent = "Saved · now";

  updateProgressBadge(activeNote);
  renderTaskItems(activeNote);

  // Active color dot
  const dots = cardColorSwatches.querySelectorAll(".swatch-dot");
  dots.forEach((dot) => {
    if (dot.dataset.color === activeNote.color) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  undoDrawer.style.display = "none";
}

function updateProgressBadge(activeNote) {
  if (!cardProgressPill) return;

  const items = ensureNoteItems(activeNote);
  const total = items.length;
  const done = items.filter((it) => it.done).length;

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

function renderTaskItems(activeNote) {
  if (!activeTasksGroup || !completedTasksGroup) return;

  activeTasksGroup.innerHTML = "";
  completedTasksGroup.innerHTML = "";

  const items = ensureNoteItems(activeNote);
  const activeItems = items.filter((it) => !it.done);
  const completedItems = items.filter((it) => it.done);

  if (items.length === 0) {
    activeTasksGroup.innerHTML = `<div class="empty-tasks-placeholder">No tasks yet. Type above to add your first task!</div>`;
  } else {
    activeItems.forEach((item) => {
      activeTasksGroup.appendChild(createTaskRowElement(item, activeNote));
    });
  }

  if (completedItems.length > 0) {
    completedTasksSection.style.display = "block";
    completedSectionTitle.textContent = `Completed (${completedItems.length})`;
    completedItems.forEach((item) => {
      completedTasksGroup.appendChild(createTaskRowElement(item, activeNote));
    });
  } else {
    completedTasksSection.style.display = "none";
  }
}

function createTaskRowElement(item, note) {
  const row = document.createElement("div");
  row.className = `task-item-row ${item.done ? "completed" : ""}`;
  row.dataset.id = item.id;

  const checkbox = document.createElement("button");
  checkbox.type = "button";
  checkbox.className = "task-checkbox";
  checkbox.innerHTML = `<svg class="check-icon" viewBox="0 0 24 24" width="10" height="10" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  checkbox.addEventListener("click", () => {
    if (isEditingLocked()) {
      if (confirm("Your 7-day free trial has expired! Editing is locked. Your tasks stay readable and exportable, but to check off or edit tasks please buy a license or enter your key.\n\nWould you like to open the purchase page?")) {
        if (window.peekyApi && window.peekyApi.openExternal) {
          window.peekyApi.openExternal("https://peeky-task.vercel.app/buy");
        }
      }
      return;
    }
    item.done = !item.done;
    note.updatedAt = Date.now();
    syncNoteBody(note);
    updateProgressBadge(note);
    persistData();
    renderTaskItems(note);
  });

  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-text-input";
  input.value = item.text || "";
  input.placeholder = "Task description...";
  if (isEditingLocked()) input.readOnly = true;

  input.addEventListener("input", (e) => {
    if (isEditingLocked()) return;
    item.text = e.target.value;
    note.updatedAt = Date.now();
    syncNoteBody(note);
    persistData();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddInput.focus();
    }
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "task-row-del-btn";
  delBtn.title = "Delete task";
  delBtn.textContent = "✕";

  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isEditingLocked()) {
      alert("Your 7-day free trial has ended. Editing is locked.");
      return;
    }
    const items = ensureNoteItems(note);
    note.items = items.filter((it) => it.id !== item.id);
    note.updatedAt = Date.now();
    syncNoteBody(note);
    updateProgressBadge(note);
    persistData();
    renderTaskItems(note);
  });

  row.appendChild(checkbox);
  row.appendChild(input);
  row.appendChild(delBtn);

  return row;
}

function isEditingLocked() {
  const trial = state.trial || {};
  if (trial.isLicensed) return false;
  const now = Date.now();
  const trialStartedAt = Number(trial.trialStartedAt) || (now - 24 * 3600 * 1000);
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  return (now - trialStartedAt) > trialDurationMs;
}

function handleQuickAdd() {
  if (isEditingLocked()) {
    if (confirm("Your 7-day free trial has expired! Editing is locked. Would you like to buy Peeky Task to unlock lifetime editing?")) {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("https://peeky-task.vercel.app/buy");
      }
    }
    return;
  }

  const text = (quickAddInput.value || "").trim();
  if (!text) return;

  const activeNote = getActiveNote();
  if (!activeNote) return;

  const items = ensureNoteItems(activeNote);
  items.push({
    id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    text: text,
    done: false,
  });
  activeNote.updatedAt = Date.now();
  syncNoteBody(activeNote);

  quickAddInput.value = "";
  updateProgressBadge(activeNote);
  persistData();
  renderTaskItems(activeNote);
  quickAddInput.focus();
}

function closeWindow() {
  if (window.peekyApi && window.peekyApi.closeNoteCard) {
    window.peekyApi.closeNoteCard();
  }
}

function setupListeners() {
  // Title Input
  cardTitleInput.addEventListener("input", (e) => {
    if (isEditingLocked()) {
      alert("Your 7-day free trial has ended. Editing is locked. Buy a license or enter your key in Manager to edit.");
      return;
    }
    const activeNote = getActiveNote();
    if (!activeNote) return;
    activeNote.title = e.target.value;
    activeNote.updatedAt = Date.now();
    persistData();
  });

  // Quick Add
  if (quickAddInput) {
    quickAddInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleQuickAdd();
      }
    });
  }

  if (btnQuickAddIcon) {
    btnQuickAddIcon.addEventListener("click", () => {
      if (quickAddInput && quickAddInput.value.trim()) {
        handleQuickAdd();
      } else if (quickAddInput) {
        quickAddInput.focus();
      }
    });
  }

  // Toggle Completed
  if (btnToggleCompleted && completedTasksSection) {
    btnToggleCompleted.addEventListener("click", () => {
      completedTasksSection.classList.toggle("collapsed");
    });
  }

  // Close & Minimize
  if (btnCloseCard) btnCloseCard.addEventListener("click", closeWindow);
  if (btnBottomClose) btnBottomClose.addEventListener("click", closeWindow);
  if (btnMinimizeCard) btnMinimizeCard.addEventListener("click", closeWindow);

  // Mark all done
  if (btnMarkComplete) {
    btnMarkComplete.addEventListener("click", () => {
      const activeNote = getActiveNote();
      if (!activeNote) return;
      const items = ensureNoteItems(activeNote);
      const allDone = items.length > 0 && items.every((it) => it.done);
      items.forEach((it) => (it.done = !allDone));
      activeNote.updatedAt = Date.now();
      syncNoteBody(activeNote);
      updateProgressBadge(activeNote);
      persistData();
      renderTaskItems(activeNote);
    });
  }

  // Color Swatches
  const swatchDots = cardColorSwatches.querySelectorAll(".swatch-dot");
  swatchDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      if (isEditingLocked()) {
        alert("Your 7-day free trial has expired! Editing is locked.");
        return;
      }
      const activeNote = getActiveNote();
      if (!activeNote) return;
      activeNote.color = dot.dataset.color;
      activeNote.updatedAt = Date.now();
      renderCard();
      persistData();
    });
  });

  // Delete with 10s undo
  if (btnCardDelete) {
    btnCardDelete.addEventListener("click", () => {
      if (isEditingLocked()) {
        alert("Your 7-day free trial has expired! Editing is locked.");
        return;
      }
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
  }

  // Undo Delete
  if (btnCardUndo) {
    btnCardUndo.addEventListener("click", () => {
      if (undoTimeout) clearTimeout(undoTimeout);
      undoDrawer.style.display = "none";
      deletedNoteBackup = null;
    });
  }

  // Global Keys
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeWindow();
    }
  });

  // IPC listener for note selection
  if (window.peekyApi && window.peekyApi.onShowNoteCard) {
    window.peekyApi.onShowNoteCard((noteId) => {
      if (noteId) state.activeNoteId = noteId;
      renderCard();
      setTimeout(() => {
        if (quickAddInput) quickAddInput.focus();
      }, 50);
    });
  }

  // IPC listener for focus quick add
  if (window.peekyApi && window.peekyApi.onFocusQuickAdd) {
    window.peekyApi.onFocusQuickAdd(() => {
      renderCard();
      setTimeout(() => {
        if (quickAddInput) {
          quickAddInput.focus();
          quickAddInput.select();
        }
      }, 50);
    });
  }

  // IPC listener for data update
  if (window.peekyApi && window.peekyApi.onDataUpdated) {
    window.peekyApi.onDataUpdated((data) => {
      if (data) {
        if (data.notes) state.notes = data.notes;
        if (data.font) {
          state.font = data.font;
          document.body.className = `font-${data.font}`;
        }
        renderCard();
      }
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
  persistData();
}

async function init() {
  if (window.peekyApi && window.peekyApi.loadData) {
    try {
      const saved = await window.peekyApi.loadData();
      if (saved) {
        if (saved.notes) state.notes = saved.notes;
        if (saved.activeNoteId) state.activeNoteId = saved.activeNoteId;
        if (saved.font) {
          state.font = saved.font;
          document.body.className = `font-${saved.font}`;
        }
      }
    } catch (e) {}
  }

  setupListeners();
  renderCard();
}

document.addEventListener("DOMContentLoaded", init);
