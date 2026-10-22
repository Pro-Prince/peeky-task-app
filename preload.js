const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("peekyApi", {
  // Window controls
  close: () => ipcRenderer.send("window-close"),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send("window-set-always-on-top", alwaysOnTop),
  dockEdge: (edge) => ipcRenderer.send("dock-edge", edge),
  setDeckHovered: (hovered) => ipcRenderer.send("set-deck-hovered", hovered),
  setDeckPeeking: (peeking) => ipcRenderer.send("set-deck-peeking", peeking),

  // Centered Note Card Window
  openNoteCard: (noteId) => ipcRenderer.send("open-note-card", noteId),
  closeNoteCard: () => ipcRenderer.send("close-note-card"),

  // Manager & Onboarding Windows
  openManager: () => ipcRenderer.send("open-manager"),
  closeManager: () => ipcRenderer.send("close-manager"),
  openOnboarding: () => ipcRenderer.send("open-onboarding"),
  launchStickyTasks: (edge) => ipcRenderer.send("launch-sticky-tasks", edge),

  // File persistence & Settings
  loadData: () => ipcRenderer.invoke("data-load"),
  saveData: (data) => ipcRenderer.invoke("data-save", data),
  getLoginItemSettings: () => ipcRenderer.invoke("get-login-item-settings"),
  setLoginItemSettings: (val) => ipcRenderer.invoke("set-login-item-settings", val),

  // External URLs
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // Listeners from Main
  onEdgeChanged: (callback) => ipcRenderer.on("edge-changed", (event, edge) => callback(edge)),
  onAlwaysOnTopChanged: (callback) => ipcRenderer.on("always-on-top-changed", (event, val) => callback(val)),
  onDataUpdated: (callback) => ipcRenderer.on("data-updated", (event, data) => callback(data)),
  onShowNoteCard: (callback) => ipcRenderer.on("show-note-card", (event, noteId) => callback(noteId)),
  onFocusQuickAdd: (callback) => ipcRenderer.on("focus-quick-add", () => callback()),
});
