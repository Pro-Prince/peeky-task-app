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
const quickAddInput = document.getElementById("quickAddInput");
const btnQuickAddIcon = document.getElementById("btnQuickAddIcon");
const taskItemsContainer = document.getElementById("taskItemsContainer");
const activeTasksGroup = document.getElementById("activeTasksGroup");
const completedTasksSection = document.getElementById("completedTasksSection");
const completedTasksGroup = document.getElementById("completedTasksGroup");
const btnToggleCompleted = document.getElementById("btnToggleCompleted");
const completedSectionTitle = document.getElementById("completedSectionTitle");
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

// Ensure note has structured items array
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
    const items = ensureNoteItems(note);
    const total = items.length;
    const done = items.filter((it) => it.done).length;
    const isCompleted = total > 0 && done === total;

    const tab = document.createElement("div");
    tab.className = `rail-tab ${state.isCardOpen && note.id === state.activeNoteId ? "active" : ""}`;
    const colorInfo = COLOR_MAP[note.color] || COLOR_MAP.butter;
    tab.style.backgroundColor = colorInfo.bg;
    tab.title = note.title || "Untitled";

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

// Render To-Do Task Card
function renderCard() {
  const activeNote = getActiveNote();
  if (!activeNote) {
    setCardOpenState(false);
    return;
  }

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.mint;
  noteCard.style.backgroundColor = colorInfo.bg;

  cardTitleInput.value = activeNote.title || "Untitled list";
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
  const cardProgressPill = document.getElementById("cardProgressPill");
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

  // Checkbox button
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
    updateProgressBadge(note);
    renderRailTabs();
    persistData();
    renderTaskItems(note);
  });

  // Text input
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
      updateProgressBadge(note);
      renderRailTabs();
      persistData();
      renderTaskItems(note);

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
        updateProgressBadge(note);
        renderRailTabs();
        persistData();
        renderTaskItems(note);

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
        updateProgressBadge(note);
        renderRailTabs();
        persistData();
        renderTaskItems(note);
        if (quickAddInput) quickAddInput.focus();
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
      } else if (quickAddInput) {
        e.preventDefault();
        quickAddInput.focus();
      }
    }
  });

  // Delete button
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
    updateProgressBadge(note);
    renderRailTabs();
    persistData();
    renderTaskItems(note);
  });

  row.appendChild(checkbox);
  row.appendChild(input);
  row.appendChild(delBtn);

  return row;
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

  // Quick Add Task Input
  function handleQuickAdd() {
    if (!quickAddInput) return;
    const text = quickAddInput.value.trim();
    if (!text) return;

    const activeNote = getActiveNote();
    if (!activeNote) return;

    const items = ensureNoteItems(activeNote);
    const newItem = {
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: text,
      done: false,
    };
    items.push(newItem);
    activeNote.updatedAt = Date.now();
    syncNoteBody(activeNote);

    quickAddInput.value = "";
    updateProgressBadge(activeNote);
    renderRailTabs();
    persistData();
    renderTaskItems(activeNote);
    quickAddInput.focus();
  }

  if (quickAddInput) {
    quickAddInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleQuickAdd();
      } else if (e.key === "ArrowDown") {
        const firstInput = activeTasksGroup?.querySelector(".task-text-input");
        if (firstInput) {
          e.preventDefault();
          firstInput.focus();
        }
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

  // Toggle Completed tasks section
  if (btnToggleCompleted && completedTasksSection) {
    btnToggleCompleted.addEventListener("click", () => {
      completedTasksSection.classList.toggle("collapsed");
    });
  }

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

      const items = ensureNoteItems(activeNote);
      activeNote.items = items.filter((it) => !it.done);
      activeNote.updatedAt = Date.now();
      syncNoteBody(activeNote);

      updateProgressBadge(activeNote);
      renderRailTabs();
      persistData();
      renderTaskItems(activeNote);
    });
  }

  // Mark all complete / uncheck all button
  btnMarkComplete.addEventListener("click", () => {
    const activeNote = getActiveNote();
    if (!activeNote) return;

    const items = ensureNoteItems(activeNote);
    const hasUncompleted = items.some((it) => !it.done);
    items.forEach((it) => {
      it.done = hasUncompleted;
    });

    activeNote.updatedAt = Date.now();
    syncNoteBody(activeNote);
    updateProgressBadge(activeNote);
    renderRailTabs();
    persistData();
    renderTaskItems(activeNote);
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

  // Add Task List Button (+) matching Screenshot 5
  btnAddNote.addEventListener("click", () => {
    const newNote = {
      id: "task_" + Date.now(),
      title: "New List",
      color: "mint",
      items: [
        { id: "item_" + Date.now() + "_1", text: "", done: false }
      ],
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
      const firstInput = document.querySelector(".task-text-input");
      if (firstInput) {
        firstInput.focus();
      } else if (quickAddInput) {
        quickAddInput.focus();
      }
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
