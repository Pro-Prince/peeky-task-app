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

// Initial default tasks
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
  currentFilter: "all", // "all" | "deck" | "completed" | "archive"
  searchQuery: "",
  sortBy: "updated", // "updated" | "title" | "color"
  edge: "right",
  theme: "dark",
  font: "handwritten",
  hideOverFullscreen: true,
  launchAtStartup: false,
  trial: {
    isLicensed: false,
    trialStartedAt: Date.now(),
    licenseKey: "",
  },
};

// Undo stack for 10s task deletion
let lastDeletedTask = null;

// DOM Elements - Left Column & Search
const notesListContainer = document.getElementById("notesListContainer");
const notesCountBadge = document.getElementById("notesCountBadge");
const notesListTitle = document.getElementById("notesListTitle");
const searchInput = document.getElementById("searchInput");
const btnNewNotePrimary = document.getElementById("btnNewNotePrimary");
const btnSortNotes = document.getElementById("btnSortNotes");

// Nav Buttons
const navAllNotes = document.getElementById("navAllNotes");
const navOnDeck = document.getElementById("navOnDeck");
const navCompleted = document.getElementById("navCompleted");
const navArchive = document.getElementById("navArchive");

// Sidebar Bottom Buttons
const btnSidebarSettings = document.getElementById("btnSidebarSettings");
const btnSidebarAbout = document.getElementById("btnSidebarAbout");

// View Panes
const tasksWorkspaceView = document.getElementById("tasksWorkspaceView");
const settingsView = document.getElementById("settingsView");
const aboutView = document.getElementById("aboutView");

// Editor Pane
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
const btnArchiveNote = document.getElementById("btnArchiveNote");
const btnExportNote = document.getElementById("btnExportNote");
const btnDeleteNote = document.getElementById("btnDeleteNote");
const paletteDots = document.getElementById("paletteDots");

// Archived Notice Banner
const archivedNoticeBanner = document.getElementById("archivedNoticeBanner");
const btnRestoreArchived = document.getElementById("btnRestoreArchived");
const btnPermanentDelete = document.getElementById("btnPermanentDelete");

// Trial Banner & License Modal
const trialBanner = document.getElementById("trialBanner");
const trialBannerHeadline = document.getElementById("trialBannerHeadline");
const trialBannerSubtext = document.getElementById("trialBannerSubtext");
const btnEnterKey = document.getElementById("btnEnterKey");
const btnBuyNotes = document.getElementById("btnBuyNotes");
const licenseModal = document.getElementById("licenseModal");
const inputLicenseKey = document.getElementById("inputLicenseKey");
const btnCancelLicense = document.getElementById("btnCancelLicense");
const btnConfirmLicense = document.getElementById("btnConfirmLicense");

// Settings View Elements (Screenshot 1)
const cardThemeSystem = document.getElementById("cardThemeSystem");
const cardThemeLight = document.getElementById("cardThemeLight");
const cardThemeDark = document.getElementById("cardThemeDark");
const cardEdgeLeft = document.getElementById("cardEdgeLeft");
const cardEdgeRight = document.getElementById("cardEdgeRight");
const fontPillSelector = document.getElementById("fontPillSelector");
const chkHideFullscreen = document.getElementById("chkHideFullscreen");
const chkStartup = document.getElementById("chkStartup");
const settingsLicenseCard = document.getElementById("settingsLicenseCard");
const settingsLicenseIcon = document.getElementById("settingsLicenseIcon");
const settingsLicenseTitle = document.getElementById("settingsLicenseTitle");
const settingsLicenseSub = document.getElementById("settingsLicenseSub");
const settingsLicenseActions = document.getElementById("settingsLicenseActions");
const btnSettingsEnterKey = document.getElementById("btnSettingsEnterKey");
const btnSettingsBuy = document.getElementById("btnSettingsBuy");

// About View Elements (Screenshot 2)
const btnAboutPrivacy = document.getElementById("btnAboutPrivacy");
const btnAboutSupport = document.getElementById("btnAboutSupport");
const btnAboutFeatures = document.getElementById("btnAboutFeatures");

// Dynamic 7-Day Trial Calculation
function getTrialStatus() {
  const trial = state.trial || {};
  const isLicensed = !!trial.isLicensed;
  if (isLicensed) {
    return {
      isLicensed: true,
      daysRemaining: 7,
      isExpired: false,
      endDateStr: "",
      licenseKey: trial.licenseKey || "Active",
    };
  }

  const now = Date.now();
  const trialStartedAt = Number(trial.trialStartedAt) || now;
  const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
  const trialEndsAt = trialStartedAt + trialDurationMs;
  const msRemaining = trialEndsAt - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const isExpired = daysRemaining <= 0;

  // Format date like screenshot: "Tuesday 27 October"
  const endDate = new Date(trialEndsAt);
  const dayOfWeek = endDate.toLocaleDateString("en-US", { weekday: "long" });
  const dayOfMonth = endDate.getDate();
  const monthName = endDate.toLocaleDateString("en-US", { month: "long" });
  const endDateStr = `${dayOfWeek} ${dayOfMonth} ${monthName}`;

  return {
    isLicensed: false,
    daysRemaining,
    isExpired,
    endDateStr,
    trialEndsAt,
    licenseKey: trial.licenseKey || "",
  };
}

function isEditingLocked() {
  const s = getTrialStatus();
  return s.isExpired && !s.isLicensed;
}

function updateTrialUI() {
  const status = getTrialStatus();

  if (status.isLicensed) {
    if (trialBanner) trialBanner.style.display = "none";
    if (settingsLicenseCard) {
      settingsLicenseCard.className = "license-status-card";
      if (settingsLicenseIcon) settingsLicenseIcon.textContent = "✓";
      if (settingsLicenseTitle) settingsLicenseTitle.textContent = "Pro License Active";
      if (settingsLicenseSub) {
        const masked = status.licenseKey && status.licenseKey.length >= 8
          ? status.licenseKey.slice(0, 4) + "-••••-••••"
          : "Active";
        settingsLicenseSub.textContent = `Lifetime unlock · Key: ${masked} · All features enabled`;
      }
      if (settingsLicenseActions) settingsLicenseActions.style.display = "none";
    }
  } else if (!status.isExpired) {
    if (trialBanner) {
      trialBanner.style.display = "flex";
      trialBanner.classList.remove("expired");
    }
    if (trialBannerHeadline) {
      trialBannerHeadline.textContent = status.daysRemaining === 1
        ? "1 day left in your free trial"
        : `${status.daysRemaining} days left in your free trial`;
    }
    if (trialBannerSubtext) {
      trialBannerSubtext.textContent = `Everything is unlocked until ${status.endDateStr}. After that your tasks stay readable and exportable, but editing is locked.`;
    }

    if (settingsLicenseCard) {
      settingsLicenseCard.className = "license-status-card trial";
      if (settingsLicenseIcon) settingsLicenseIcon.textContent = "⏱";
      if (settingsLicenseTitle) settingsLicenseTitle.textContent = `Free Trial Active (${status.daysRemaining} days remaining)`;
      if (settingsLicenseSub) settingsLicenseSub.textContent = `Full access until ${status.endDateStr}`;
      if (settingsLicenseActions) settingsLicenseActions.style.display = "flex";
    }
  } else {
    // Expired
    if (trialBanner) {
      trialBanner.style.display = "flex";
      trialBanner.classList.add("expired");
    }
    if (trialBannerHeadline) {
      trialBannerHeadline.textContent = "Your trial has ended";
    }
    if (trialBannerSubtext) {
      trialBannerSubtext.textContent = "Your tasks are safe and you can still read, search and export them. Buy a licence to start writing again.";
    }

    if (settingsLicenseCard) {
      settingsLicenseCard.className = "license-status-card expired";
      if (settingsLicenseIcon) settingsLicenseIcon.textContent = "!";
      if (settingsLicenseTitle) settingsLicenseTitle.textContent = "Trial Expired";
      if (settingsLicenseSub) settingsLicenseSub.textContent = "Editing is locked. Read and export are unlocked.";
      if (settingsLicenseActions) settingsLicenseActions.style.display = "flex";
    }
  }
}

// Workspace View Switching (Tasks, Settings, About)
function switchWorkspaceView(viewName) {
  const allNavBtns = [navAllNotes, navOnDeck, navCompleted, navArchive, btnSidebarSettings, btnSidebarAbout].filter(Boolean);
  allNavBtns.forEach((b) => b.classList.remove("active"));

  if (viewName === "settings") {
    if (tasksWorkspaceView) tasksWorkspaceView.style.display = "none";
    if (aboutView) aboutView.style.display = "none";
    if (settingsView) settingsView.style.display = "flex";
    if (btnSidebarSettings) btnSidebarSettings.classList.add("active");
    syncSettingsUI();
  } else if (viewName === "about") {
    if (tasksWorkspaceView) tasksWorkspaceView.style.display = "none";
    if (settingsView) settingsView.style.display = "none";
    if (aboutView) aboutView.style.display = "flex";
    if (btnSidebarAbout) btnSidebarAbout.classList.add("active");
  } else {
    if (settingsView) settingsView.style.display = "none";
    if (aboutView) aboutView.style.display = "none";
    if (tasksWorkspaceView) tasksWorkspaceView.style.display = "flex";

    if (state.currentFilter === "deck" && navOnDeck) navOnDeck.classList.add("active");
    else if (state.currentFilter === "completed" && navCompleted) navCompleted.classList.add("active");
    else if (state.currentFilter === "archive" && navArchive) navArchive.classList.add("active");
    else if (navAllNotes) navAllNotes.classList.add("active");

    renderNotesList();
    renderEditor();
  }
}

// Synchronize Settings View state with controls
async function syncSettingsUI() {
  const currentTheme = state.theme || "dark";
  [cardThemeSystem, cardThemeLight, cardThemeDark].filter(Boolean).forEach((c) => {
    if (c.dataset.theme === currentTheme) c.classList.add("selected");
    else c.classList.remove("selected");
  });

  const currentEdge = state.edge || "right";
  [cardEdgeLeft, cardEdgeRight].filter(Boolean).forEach((c) => {
    if (c.dataset.edge === currentEdge) c.classList.add("selected");
    else c.classList.remove("selected");
  });

  const currentFont = state.font || "handwritten";
  applyFont(currentFont);
  if (fontPillSelector) {
    const fontBtns = fontPillSelector.querySelectorAll(".font-pill-btn");
    fontBtns.forEach((btn) => {
      if (btn.dataset.font === currentFont) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  if (chkHideFullscreen) {
    chkHideFullscreen.checked = state.hideOverFullscreen !== false;
  }

  if (chkStartup && window.peekyApi && window.peekyApi.getLoginItemSettings) {
    try {
      const autoStart = await window.peekyApi.getLoginItemSettings();
      chkStartup.checked = !!autoStart;
    } catch (e) {}
  }

  if (dataPathInput && window.peekyApi && window.peekyApi.getDataPath) {
    try {
      const p = await window.peekyApi.getDataPath();
      if (p) dataPathInput.value = p;
    } catch (err) {}
  }
}

function applyFont(fontKey) {
  state.font = fontKey;
  document.body.classList.remove("font-handwritten", "font-normal", "font-rounded", "font-typewriter");
  document.body.classList.add(`font-${fontKey}`);
}

function applyTheme(theme) {
  state.theme = theme;
  if (theme === "system") {
    const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.className = isDark ? "theme-dark" : "theme-light";
  } else if (theme === "light") {
    document.body.className = "theme-light";
  } else {
    document.body.className = "theme-dark";
  }
  if (state.font) {
    document.body.classList.add(`font-${state.font}`);
  }

  [cardThemeSystem, cardThemeLight, cardThemeDark].filter(Boolean).forEach((btn) => {
    if (btn.dataset.theme === theme) btn.classList.add("selected");
    else btn.classList.remove("selected");
  });
}

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
  const filtered = getFilteredNotes();
  const found = filtered.find((n) => n.id === state.activeNoteId);
  if (found) return found;
  if (filtered.length > 0) {
    state.activeNoteId = filtered[0].id;
    return filtered[0];
  }
  return state.notes.find((n) => n.id === state.activeNoteId) || state.notes[0];
}

function getFilteredNotes() {
  let list = state.notes.filter((note) => {
    const items = ensureNoteItems(note);
    const total = items.length;
    const done = items.filter((it) => it.done).length;
    const isCompleted = total > 0 && done === total;

    // Archive view
    if (state.currentFilter === "archive") {
      return note.archived === true;
    }

    // All active tabs exclude archived tasks
    if (note.archived) return false;

    if (state.currentFilter === "deck") {
      return note.onDeck !== false;
    }
    if (state.currentFilter === "completed") {
      return isCompleted;
    }
    // "all"
    return true;
  });

  // Search query filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter((note) => {
      const matchTitle = (note.title || "").toLowerCase().includes(q);
      const matchBody = (note.items || []).some((it) => (it.text || "").toLowerCase().includes(q));
      return matchTitle || matchBody;
    });
  }

  // Sort lists
  if (state.sortBy === "title") {
    list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (state.sortBy === "color") {
    list.sort((a, b) => (a.color || "").localeCompare(b.color || ""));
  } else {
    // Default: updated (newest first)
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  return list;
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

  if (list.length === 0) {
    let emptyMsg = "No task lists found. Click + above to create your first list!";
    if (state.currentFilter === "deck") {
      emptyMsg = "No task lists on the deck. Pin a list to view it on your screen edge rail.";
    } else if (state.currentFilter === "completed") {
      emptyMsg = "No completed task lists yet. Finish all items in a list to see it here.";
    } else if (state.currentFilter === "archive") {
      emptyMsg = "Your archive is empty. Archive finished projects to keep your active deck clean.";
    } else if (state.searchQuery) {
      emptyMsg = `No task lists matching "${state.searchQuery}".`;
    }

    notesListContainer.innerHTML = `
      <div class="notes-column-empty">
        <svg class="notes-column-empty-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <div class="notes-column-empty-text">${emptyMsg}</div>
      </div>
    `;
    return;
  }

  list.forEach((note) => {
    const item = document.createElement("div");
    item.className = `note-list-item ${note.id === state.activeNoteId ? "active" : ""}`;

    const colorDot = document.createElement("span");
    colorDot.className = "item-color-dot";
    colorDot.style.backgroundColor = (COLOR_MAP[note.color] || COLOR_MAP.butter).bg;

    const info = document.createElement("div");
    info.className = "item-info";

    const titleRow = document.createElement("div");
    titleRow.className = "item-title-row";
    titleRow.style.display = "flex";
    titleRow.style.alignItems = "center";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.gap = "6px";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = note.title || "Untitled task";

    titleRow.appendChild(title);

    // Indicator badge (Deck / Archived / Done)
    const items = ensureNoteItems(note);
    const total = items.length;
    const done = items.filter((it) => it.done).length;
    const isCompleted = total > 0 && done === total;

    if (note.archived) {
      const badge = document.createElement("span");
      badge.style.fontSize = "10px";
      badge.style.padding = "1px 5px";
      badge.style.borderRadius = "4px";
      badge.style.background = "rgba(245, 158, 11, 0.2)";
      badge.style.color = "#F59E0B";
      badge.textContent = "Archived";
      titleRow.appendChild(badge);
    } else if (isCompleted) {
      const badge = document.createElement("span");
      badge.style.fontSize = "10px";
      badge.style.padding = "1px 5px";
      badge.style.borderRadius = "4px";
      badge.style.background = "rgba(46, 125, 50, 0.2)";
      badge.style.color = "#4CAF50";
      badge.textContent = "✓ Done";
      titleRow.appendChild(badge);
    } else if (note.onDeck) {
      const pin = document.createElement("span");
      pin.className = "deck-chip";
      pin.title = "Pinned on deck";
      pin.textContent = "On deck";
      titleRow.appendChild(pin);
    }

    const snippet = document.createElement("div");
    snippet.className = "item-snippet";
    const firstTaskText = items[0]?.text || "No tasks";
    const progress = getTaskProgress(note);
    snippet.textContent = `${progress}${firstTaskText}`;

    info.appendChild(titleRow);
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
    if (archivedNoticeBanner) archivedNoticeBanner.style.display = "none";
    return;
  }

  const colorInfo = COLOR_MAP[activeNote.color] || COLOR_MAP.butter;
  noteEditorPane.style.backgroundColor = colorInfo.bg;

  editorTitleInput.value = activeNote.title || "";
  editorMetaTime.textContent = formatRelativeTime(activeNote.updatedAt);
  editorDateStamp.textContent = `Created ${formatDate(activeNote.createdAt)} · Updated ${formatRelativeTime(activeNote.updatedAt)}`;

  // Archived Notice Banner
  if (archivedNoticeBanner) {
    if (activeNote.archived) {
      archivedNoticeBanner.style.display = "flex";
      editorTitleInput.readOnly = true;
      if (btnArchiveNote) {
        btnArchiveNote.title = "Restore from archive";
        btnArchiveNote.classList.add("active");
      }
    } else {
      archivedNoticeBanner.style.display = "none";
      editorTitleInput.readOnly = false;
      if (btnArchiveNote) {
        btnArchiveNote.title = "Archive task list";
        btnArchiveNote.classList.remove("active");
      }
    }
  }

  // Update deck badge
  const dot = deckStatusBadge.querySelector(".status-indicator-dot");
  const label = deckStatusBadge.querySelector(".status-indicator-label");
  if (activeNote.archived) {
    dot.style.background = "#F59E0B";
    label.textContent = "Archived · click to restore";
  } else if (activeNote.onDeck !== false) {
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

  checkbox.tabIndex = 0;
  checkbox.title = item.done ? "Mark as to-do (Space to toggle)" : "Mark as completed (Space to toggle)";
  checkbox.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      checkbox.click();
    }
  });

  checkbox.addEventListener("click", (e) => {
    e.stopPropagation();
    if (note.archived) {
      alert("Please restore this list from the archive to edit or check off tasks.");
      return;
    }
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
  if (note.archived) input.readOnly = true;

  input.addEventListener("input", (e) => {
    if (note.archived) return;
    item.text = e.target.value;
    note.updatedAt = Date.now();
    syncNoteBody(note);
    persistData();
  });

  input.addEventListener("keydown", (e) => {
    if (note.archived) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === " " || e.key === "Spacebar" || e.key === "Enter")) {
      e.preventDefault();
      checkbox.click();
      return;
    }
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
    if (note.archived) {
      alert("Please restore this list from the archive to delete tasks.");
      return;
    }
    const items = ensureNoteItems(note);
    const idx = items.findIndex((it) => it.id === item.id);
    if (idx !== -1) {
      lastDeletedTask = {
        noteId: note.id,
        item: { ...items[idx] },
        index: idx,
        timestamp: Date.now(),
      };
      items.splice(idx, 1);
    }
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
  // Navigation filters (All tasks, On the deck, Completed, Archive)
  const navBtns = [navAllNotes, navOnDeck, navCompleted, navArchive].filter(Boolean);
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchWorkspaceView("tasks");
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentFilter = btn.dataset.filter;

      if (state.currentFilter === "all") notesListTitle.textContent = "All tasks";
      else if (state.currentFilter === "deck") notesListTitle.textContent = "On the deck";
      else if (state.currentFilter === "completed") notesListTitle.textContent = "Completed tasks";
      else if (state.currentFilter === "archive") notesListTitle.textContent = "Archive";

      renderNotesList();
      renderEditor();
    });
  });

  // Sidebar Settings Button
  if (btnSidebarSettings) {
    btnSidebarSettings.addEventListener("click", () => {
      switchWorkspaceView("settings");
    });
  }

  // Sidebar About Button
  if (btnSidebarAbout) {
    btnSidebarAbout.addEventListener("click", () => {
      switchWorkspaceView("about");
    });
  }

  // Search input
  searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    renderNotesList();
  });

  // Sort button: cycles sort order
  btnSortNotes.addEventListener("click", () => {
    if (state.sortBy === "updated") {
      state.sortBy = "title";
      btnSortNotes.title = "Sorted: A-Z";
    } else if (state.sortBy === "title") {
      state.sortBy = "color";
      btnSortNotes.title = "Sorted: By Color";
    } else {
      state.sortBy = "updated";
      btnSortNotes.title = "Sorted: Recently Updated";
    }
    renderNotesList();
  });

  // Add new task list
  btnNewNotePrimary.addEventListener("click", () => {
    if (isEditingLocked()) {
      alert("Your 7-day free trial has ended. Editing is locked. Buy a license or enter your key to create and edit tasks.");
      licenseModal.style.display = "flex";
      inputLicenseKey.focus();
      return;
    }
    const usedColors = state.notes.map((n) => n.color);
    const unused = COLOR_KEYS.find((c) => !usedColors.includes(c)) || COLOR_KEYS[state.notes.length % COLOR_KEYS.length];

    const newNote = {
      id: "task_" + Date.now(),
      title: "New task list",
      color: unused,
      items: [
        { id: "item_" + Date.now() + "_1", text: "", done: false }
      ],
      body: "- [ ] ",
      onDeck: true,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    state.notes.unshift(newNote);
    state.activeNoteId = newNote.id;

    // Switch to All tasks tab if currently in archive or completed
    if (state.currentFilter === "archive" || state.currentFilter === "completed") {
      state.currentFilter = "all";
      navBtns.forEach((b) => b.classList.remove("active"));
      if (navAllNotes) navAllNotes.classList.add("active");
      if (notesListTitle) notesListTitle.textContent = "All tasks";
    }

    renderNotesList();
    renderEditor();
    persistData();

    editorTitleInput.focus();
    editorTitleInput.select();
  });

  // Title editor
  editorTitleInput.addEventListener("input", (e) => {
    const note = getActiveNote();
    if (!note || note.archived) return;
    note.title = e.target.value;
    note.updatedAt = Date.now();
    editorMetaTime.textContent = "edited just now";
    renderNotesList();
    persistData();
  });

  // Manager Quick Add Task
  function handleManagerQuickAdd() {
    if (!managerQuickAddInput) return;
    if (isEditingLocked()) {
      alert("Your 7-day free trial has ended. Editing is locked. Buy a license or enter your key to create and edit tasks.");
      licenseModal.style.display = "flex";
      inputLicenseKey.focus();
      return;
    }
    const text = managerQuickAddInput.value.trim();
    if (!text) return;

    const note = getActiveNote();
    if (!note) return;
    if (note.archived) {
      alert("Please restore this list from the archive to add tasks.");
      return;
    }

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
      if (!note || note.archived) return;
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
      if (!note || note.archived) return;
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
    if (note.archived) {
      // If archived, unarchive and pin if capacity allows
      const deckNotes = state.notes.filter((n) => n.onDeck && !n.archived);
      if (deckNotes.length >= 7) {
        alert("Screen edge is full. Unpin or complete a task list to pin another.");
        return;
      }
      note.archived = false;
      note.onDeck = true;
    } else {
      if (!note.onDeck) {
        const deckNotes = state.notes.filter((n) => n.onDeck && !n.archived);
        if (deckNotes.length >= 7) {
          alert("Screen edge is full. Unpin or complete a task list to pin another.");
          return;
        }
        note.onDeck = true;
      } else {
        note.onDeck = false;
      }
    }
    renderEditor();
    renderNotesList();
    persistData();
  });

  deckStatusBadge.addEventListener("click", () => {
    btnToggleDeck.click();
  });

  // Archive / Unarchive Button in editor top bar
  if (btnArchiveNote) {
    btnArchiveNote.addEventListener("click", () => {
      const note = getActiveNote();
      if (!note) return;
      note.archived = !note.archived;
      if (note.archived) {
        note.onDeck = false; // remove from floating edge deck when archived
      } else {
        note.onDeck = true; // restore to deck
      }
      note.updatedAt = Date.now();
      renderNotesList();
      renderEditor();
      persistData();
    });
  }

  // Restore button in Archived Notice Banner
  if (btnRestoreArchived) {
    btnRestoreArchived.addEventListener("click", () => {
      const note = getActiveNote();
      if (!note) return;
      note.archived = false;
      note.onDeck = true;
      note.updatedAt = Date.now();
      renderNotesList();
      renderEditor();
      persistData();
    });
  }

  // Permanent Delete button in Archived Notice Banner
  if (btnPermanentDelete) {
    btnPermanentDelete.addEventListener("click", () => {
      const note = getActiveNote();
      if (!note) return;
      if (confirm(`Permanently delete "${note.title || 'Untitled'}"? This cannot be undone.`)) {
        state.notes = state.notes.filter((n) => n.id !== note.id);
        state.activeNoteId = state.notes[0]?.id || null;
        renderNotesList();
        renderEditor();
        persistData();
      }
    });
  }

  // Delete task list button in editor top bar
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
    if (!note || note.archived) return;
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

  // ================= NATIVE SETTINGS & ABOUT VIEWS (Screenshots 1 & 2) =================

  // Theme cards in Settings
  [cardThemeSystem, cardThemeLight, cardThemeDark].filter(Boolean).forEach((card) => {
    card.addEventListener("click", () => {
      const themeKey = card.dataset.theme;
      applyTheme(themeKey);
      persistData();
    });
  });

  // Screen Edge cards in Settings
  [cardEdgeLeft, cardEdgeRight].filter(Boolean).forEach((card) => {
    card.addEventListener("click", () => {
      const edgeKey = card.dataset.edge;
      state.edge = edgeKey;
      [cardEdgeLeft, cardEdgeRight].filter(Boolean).forEach((c) => {
        if (c.dataset.edge === edgeKey) c.classList.add("selected");
        else c.classList.remove("selected");
      });
      if (window.peekyApi && window.peekyApi.dockEdge) {
        window.peekyApi.dockEdge(edgeKey);
      }
      persistData();
    });
  });

  // Font Pill Selector in Settings
  if (fontPillSelector) {
    const fontBtns = fontPillSelector.querySelectorAll(".font-pill-btn");
    fontBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const fontKey = btn.dataset.font;
        applyFont(fontKey);
        fontBtns.forEach((b) => {
          if (b.dataset.font === fontKey) b.classList.add("active");
          else b.classList.remove("active");
        });
        persistData();
      });
    });
  }

  // Window Startup Switch
  if (chkStartup) {
    if (window.peekyApi && window.peekyApi.getLoginItemSettings) {
      window.peekyApi.getLoginItemSettings().then((openAtLogin) => {
        chkStartup.checked = !!openAtLogin;
      });
    }
    chkStartup.addEventListener("change", () => {
      if (window.peekyApi && window.peekyApi.setLoginItemSettings) {
        window.peekyApi.setLoginItemSettings(chkStartup.checked);
      }
      state.launchAtStartup = chkStartup.checked;
      persistData();
    });
  }

  // Hide over full-screen apps
  if (chkHideFullscreen) {
    chkHideFullscreen.checked = state.hideOverFullscreen !== false;
    chkHideFullscreen.addEventListener("change", () => {
      state.hideOverFullscreen = chkHideFullscreen.checked;
      persistData();
    });
  }

  // Settings License Actions
  if (btnSettingsEnterKey) {
    btnSettingsEnterKey.addEventListener("click", () => {
      licenseModal.style.display = "flex";
      inputLicenseKey.focus();
    });
  }

  if (btnSettingsBuy) {
    btnSettingsBuy.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("https://peeky-task.vercel.app/buy");
      }
    });
  }

  // About View Link Buttons (Matching Screenshot 2)
  if (btnAboutPrivacy) {
    btnAboutPrivacy.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("https://peeky-task.vercel.app/#privacy");
      }
    });
  }

  if (btnAboutSupport) {
    btnAboutSupport.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("mailto:princepatel5807@gmail.com?subject=Peeky%20Task%20Support");
      }
    });
  }

  if (btnAboutFeatures) {
    btnAboutFeatures.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("https://peeky-task.vercel.app/#features");
      }
    });
  }

  // Buy Peeky Task Banner Button
  if (btnBuyNotes) {
    btnBuyNotes.addEventListener("click", () => {
      if (window.peekyApi && window.peekyApi.openExternal) {
        window.peekyApi.openExternal("https://peeky-task.vercel.app/buy");
      }
    });
  }

  // Enter License Key Banner Button
  if (btnEnterKey) {
    btnEnterKey.addEventListener("click", () => {
      licenseModal.style.display = "flex";
      inputLicenseKey.focus();
    });
  }

  if (btnCancelLicense) {
    btnCancelLicense.addEventListener("click", () => {
      licenseModal.style.display = "none";
    });
  }

  // Confirm License Key Activation
  if (btnConfirmLicense) {
    btnConfirmLicense.addEventListener("click", () => {
      const key = inputLicenseKey.value.trim();
      if (key.length >= 6) {
        state.trial.isLicensed = true;
        state.trial.licenseKey = key;
        persistData();
        updateTrialUI();
        alert("License activated successfully! Full lifetime access unlocked.");
        licenseModal.style.display = "none";
      } else {
        alert("Please enter a valid license key.");
      }
    });
  }

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

  // Keyboard Shortcuts inside Manager matching website
  document.addEventListener("keydown", (e) => {
    // 1. Esc: close any open modal
    if (e.key === "Escape") {
      if (settingsModal && settingsModal.style.display === "flex") {
        settingsModal.style.display = "none";
        return;
      }
      if (aboutModal && aboutModal.style.display === "flex") {
        aboutModal.style.display = "none";
        return;
      }
      if (licenseModal && licenseModal.style.display === "flex") {
        licenseModal.style.display = "none";
        return;
      }
    }

    const isTyping = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

    // 2. Ctrl+. : Cycle task list pastel color
    if ((e.ctrlKey || e.metaKey) && e.key === ".") {
      e.preventDefault();
      const active = getActiveNote();
      if (!active || active.archived) return;
      const currentIdx = COLOR_KEYS.indexOf(active.color);
      const nextIdx = (currentIdx + 1) % COLOR_KEYS.length;
      active.color = COLOR_KEYS[nextIdx];
      active.updatedAt = Date.now();
      renderEditor();
      renderNotesList();
      persistData();
      return;
    }

    // 3. Ctrl+D : Toggle On the Deck pin
    if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
      e.preventDefault();
      const active = getActiveNote();
      if (!active || active.archived) return;
      active.onDeck = !active.onDeck;
      renderEditor();
      renderNotesList();
      persistData();
      return;
    }

    // 4. Ctrl+Z : Undo last deleted task within 10 seconds
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      if (lastDeletedTask && (Date.now() - lastDeletedTask.timestamp < 10000)) {
        e.preventDefault();
        const active = getActiveNote();
        if (active && active.id === lastDeletedTask.noteId) {
          const items = ensureNoteItems(active);
          items.splice(Math.min(lastDeletedTask.index, items.length), 0, lastDeletedTask.item);
          lastDeletedTask = null;
          active.updatedAt = Date.now();
          syncNoteBody(active);
          renderEditor();
          renderNotesList();
          persistData();
        }
      }
    }
  });
}

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (state.theme === "system") {
      applyTheme("system");
    }
  });
}

function applyEdgeCardUI(edge) {
  const curEdge = edge || state.edge || "right";
  if (cardEdgeLeft) cardEdgeLeft.classList.toggle("selected", curEdge === "left");
  if (cardEdgeRight) cardEdgeRight.classList.toggle("selected", curEdge === "right");
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

  // Ensure valid trial state
  if (!state.trial || typeof state.trial !== "object") {
    state.trial = {
      isLicensed: false,
      trialStartedAt: Date.now(),
      licenseKey: "",
    };
  } else if (!state.trial.trialStartedAt && !state.trial.isLicensed) {
    state.trial.trialStartedAt = Date.now();
  }

  // If previous trial had dummy test string 'nsnnswmsnwmnsmwns', reset to active trial
  if (state.trial.licenseKey === "nsnnswmsnwmnsmwns") {
    state.trial.isLicensed = false;
    state.trial.trialStartedAt = Date.now();
    state.trial.licenseKey = "";
    persistData();
  }

  setupListeners();
  applyTheme(state.theme || "dark");
  applyFont(state.font || "handwritten");
  applyEdgeCardUI(state.edge || "right");
  renderNotesList();
  renderEditor();
  updateTrialUI();

  if (window.peekyApi && window.peekyApi.onDataUpdated) {
    window.peekyApi.onDataUpdated((data) => {
      if (data) {
        if (data.notes) state.notes = data.notes;
        if (data.trial) state.trial = data.trial;
        if (data.font) applyFont(data.font);
        if (data.theme) applyTheme(data.theme);
        if (data.edge) {
          state.edge = data.edge;
          applyEdgeCardUI(data.edge);
        }
        renderNotesList();
        renderEditor();
        updateTrialUI();
      }
    });
  }

  // Keep countdown updated every minute
  setInterval(updateTrialUI, 60000);

  // Automatically prompt user to buy if trial has expired
  const trialStat = getTrialStatus();
  if (trialStat.isExpired && !trialStat.isLicensed) {
    setTimeout(() => {
      if (confirm("Your 7-day free trial has expired! Editing is locked. Would you like to buy Peeky Task to unlock lifetime editing?")) {
        if (window.peekyApi && window.peekyApi.openExternal) {
          window.peekyApi.openExternal("https://peeky-task.vercel.app/buy");
        }
      }
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", init);
