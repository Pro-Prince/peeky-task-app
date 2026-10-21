const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("peekyApi", {
  // Window controls
  close: () => ipcRenderer.send("window-close"),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send("window-set-always-on-top", alwaysOnTop),
  dockEdge: (edge) => ipcRenderer.send("dock-edge", edge),
  setCardOpen: (open) => ipcRenderer.send("set-card-open", open),
  setDeckHovered: (hovered) => ipcRenderer.send("set-deck-hovered", hovered),

  // Manager & Onboarding Windows
  openManager: () => ipcRenderer.send("open-manager"),
  closeManager: () => ipcRenderer.send("close-manager"),
  openOnboarding: () => ipcRenderer.send("open-onboarding"),
  launchStickyTasks: (edge) => ipcRenderer.send("launch-sticky-tasks", edge),

  // File persistence, Backup & Sync
  loadData: () => ipcRenderer.invoke("data-load"),
  saveData: (data) => ipcRenderer.invoke("data-save", data),
  openDataFolder: () => ipcRenderer.send("open-data-folder"),
  exportBackup: (data) => ipcRenderer.invoke("export-tasks-file", data),
  importBackup: () => ipcRenderer.invoke("import-tasks-file"),
  getLoginItemSettings: () => ipcRenderer.invoke("get-login-item-settings"),
  setLoginItemSettings: (val) => ipcRenderer.invoke("set-login-item-settings", val),

  // External URLs
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // Listeners from Main
  onEdgeChanged: (callback) => ipcRenderer.on("edge-changed", (event, edge) => callback(edge)),
  onAlwaysOnTopChanged: (callback) => ipcRenderer.on("always-on-top-changed", (event, val) => callback(val)),
  onDataUpdated: (callback) => ipcRenderer.on("data-updated", (event, data) => callback(data)),
  onOpenCard: (callback) => ipcRenderer.on("open-card", () => callback()),
});
