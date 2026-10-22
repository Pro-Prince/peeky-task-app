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
  edge: "right",
  font: "handwritten",
  trial: {},
};

let leaveTimer = null;

// DOM Elements
const edgeRail = document.getElementById("edgeRail");
const railTabsTrack = document.getElementById("railTabsTrack");
const btnAddNote = document.getElementById("btnAddNote");
const btnOpenManager = document.getElementById("btnOpenManager");
const btnFlipEdge = document.getElementById("btnFlipEdge");

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
  return items;
}

function persistData() {
  if (window.peekyApi && window.peekyApi.saveData) {
    window.peekyApi.saveData(state);
  }
}

function getDeckNotes() {
  return (state.notes || []).filter((n) => n.onDeck !== false && !n.archived);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "today";
  const diffHours = Math.floor((Date.now() - timestamp) / (3600 * 1000));
  if (diffHours < 1) return "edited just now";
  if (diffHours < 24) return `edited ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `edited ${diffDays}d ago`;
}

// Render Rail Tabs with attached Hover Peek Previews (Image 5)
function renderRailTabs() {
  railTabsTrack.innerHTML = "";

  const deckNotes = getDeckNotes();

  // Dynamic capacity calculation based on screen height
  const availHeight = window.innerHeight - 30;
  const actionsHeight = 92;
  const tabSlotHeight = 80;
  const maxTabs = Math.max(2, Math.floor((availHeight - actionsHeight) / tabSlotHeight));

  if (btnAddNote) {
    btnAddNote.style.display = deckNotes.length >= maxTabs ? "none" : "flex";
  }

  const visibleDeckNotes = deckNotes.slice(0, maxTabs);

  visibleDeckNotes.forEach((note) => {
    const items = ensureNoteItems(note);
    const colorInfo = COLOR_MAP[note.color] || COLOR_MAP.butter;

    const tab = document.createElement("div");
    tab.className = "rail-tab";
    tab.style.backgroundColor = colorInfo.bg;
    tab.dataset.id = note.id;

    // Clean Tab Label (No tick marks, no progress counts, no '>' carets)
    const label = document.createElement("span");
    label.className = "rail-tab-label";
    label.textContent = note.title || "Untitled";
    tab.appendChild(label);

    // Attached Hover Peek Preview Card (Matching purple card in Image 5)
    const peekCard = document.createElement("div");
    peekCard.className = "tab-peek-preview";
    peekCard.style.backgroundColor = colorInfo.bg;

    const peekTitle = document.createElement("div");
    peekTitle.className = "peek-title";
    peekTitle.textContent = note.title || "Untitled note";
    peekCard.appendChild(peekTitle);

    const peekList = document.createElement("div");
    peekList.className = "peek-items-list";

    if (items.length === 0) {
      const emptyItem = document.createElement("div");
      emptyItem.className = "peek-item";
      emptyItem.style.fontStyle = "italic";
      emptyItem.style.opacity = "0.7";
      emptyItem.textContent = "No tasks yet";
      peekList.appendChild(emptyItem);
    } else {
      items.slice(0, 4).forEach((it) => {
        const itemEl = document.createElement("div");
        itemEl.className = `peek-item ${it.done ? "done" : ""}`;
        itemEl.textContent = `- ${it.text || "Task"}`;
        peekList.appendChild(itemEl);
      });
      if (items.length > 4) {
        const moreEl = document.createElement("div");
        moreEl.className = "peek-item";
        moreEl.style.opacity = "0.6";
        moreEl.textContent = `+ ${items.length - 4} more...`;
        peekList.appendChild(moreEl);
      }
    }
    peekCard.appendChild(peekList);

    const peekFooter = document.createElement("div");
    peekFooter.className = "peek-footer";
    peekFooter.textContent = formatRelativeTime(note.updatedAt);
    peekCard.appendChild(peekFooter);

    tab.appendChild(peekCard);

    // Hover to Peek
    tab.addEventListener("mouseenter", () => {
      if (window.peekyApi && window.peekyApi.setDeckPeeking) {
        window.peekyApi.setDeckPeeking(true);
      }
    });

    tab.addEventListener("mouseleave", () => {
      if (window.peekyApi && window.peekyApi.setDeckPeeking) {
        window.peekyApi.setDeckPeeking(false);
      }
    });

    // Click to Open in Middle of Screen (Image 5)
    tab.addEventListener("click", () => {
      state.activeNoteId = note.id;
      if (window.peekyApi && window.peekyApi.openNoteCard) {
        window.peekyApi.openNoteCard(note.id);
      }
      persistData();
    });

    railTabsTrack.appendChild(tab);
  });
}

function applyEdge(edge) {
  state.edge = edge;
  const fontClass = state.font ? `font-${state.font}` : "font-handwritten";
  document.body.className = `edge-${edge} ${fontClass}`;
  if (btnFlipEdge) {
    btnFlipEdge.textContent = edge === "right" ? "◨" : "◧";
    btnFlipEdge.title = `Flip Screen Edge (Currently ${edge.toUpperCase()} - click to switch)`;
  }
}

function setupListeners() {
  // Edge Rail Hover Interaction: Rested 7px vs Fanned 30px
  edgeRail.addEventListener("mouseenter", () => {
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    edgeRail.classList.remove("rested");
    if (window.peekyApi && window.peekyApi.setDeckHovered) {
      window.peekyApi.setDeckHovered(true);
    }
  });

  edgeRail.addEventListener("mouseleave", () => {
    if (leaveTimer) clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      edgeRail.classList.add("rested");
      if (window.peekyApi && window.peekyApi.setDeckHovered) {
        window.peekyApi.setDeckHovered(false);
      }
    }, 350);
  });

  // Add Note Button (+)
  if (btnAddNote) {
    btnAddNote.addEventListener("click", () => {
      const newNote = {
        id: "task_" + Date.now(),
        title: "Untitled note",
        color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
        body: "- [ ] ",
        onDeck: true,
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.notes.push(newNote);
      state.activeNoteId = newNote.id;
      renderRailTabs();
      persistData();
      if (window.peekyApi && window.peekyApi.openNoteCard) {
        window.peekyApi.openNoteCard(newNote.id);
      }
    });
  }

  // Open Manager Window (⊞)
  if (btnOpenManager) {
    btnOpenManager.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openManager) {
        window.peekyApi.openManager();
      }
    });
  }

  // Flip Edge button (◨)
  if (btnFlipEdge) {
    btnFlipEdge.addEventListener("click", () => {
      const nextEdge = state.edge === "right" ? "left" : "right";
      applyEdge(nextEdge);
      if (window.peekyApi && window.peekyApi.dockEdge) {
        window.peekyApi.dockEdge(nextEdge);
      }
      persistData();
    });
  }

  // IPC listeners from main process
  if (window.peekyApi && window.peekyApi.onEdgeChanged) {
    window.peekyApi.onEdgeChanged((edge) => {
      applyEdge(edge);
    });
  }

  if (window.peekyApi && window.peekyApi.onDataUpdated) {
    window.peekyApi.onDataUpdated((data) => {
      if (data) {
        if (data.notes) state.notes = data.notes;
        if (data.trial) state.trial = data.trial;
        if (data.font) {
          state.font = data.font;
          applyEdge(state.edge || "right");
        }
        if (data.edge) applyEdge(data.edge);
        renderRailTabs();
      }
    });
  }
}

async function init() {
  if (window.peekyApi && window.peekyApi.loadData) {
    try {
      const saved = await window.peekyApi.loadData();
      if (saved) {
        if (saved.notes && saved.notes.length > 0) state.notes = saved.notes;
        if (saved.trial) state.trial = saved.trial;
        if (saved.font) state.font = saved.font;
        if (saved.edge) state.edge = saved.edge;
      }
    } catch (e) {}
  }

  applyEdge(state.edge || "right");
  renderRailTabs();
  setupListeners();
}

document.addEventListener("DOMContentLoaded", init);
