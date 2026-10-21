const { app, BrowserWindow, ipcMain, screen, Tray, Menu, globalShortcut, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let deckWindow = null;
let managerWindow = null;
let onboardingWindow = null;
let tray = null;
let isAlwaysOnTop = true;
let currentEdge = "right"; // "left" | "right"
let isCardOpen = true; // Start with active task card open so user sees it right away!
let isDeckHovered = false;

const dataFilePath = path.join(app.getPath("userData"), "peeky-task-data.json");

// Load local user data
function loadUserData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error loading data:", err);
  }
  return null;
}

// Save local user data
function saveUserData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving data:", err);
    return false;
  }
}

function getDisplayBounds() {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.workArea;
}

function getTargetDeckWidth() {
  if (isCardOpen) return 530; // 480px card + 32px tabs + margins
  if (isDeckHovered) return 52;
  return 24; // Rested pill sliver width flush against edge
}

function repositionDeckWindow() {
  if (!deckWindow) return;
  const workArea = getDisplayBounds();
  const width = getTargetDeckWidth();
  const height = Math.min(740, workArea.height - 30);
  const targetX = currentEdge === "right" ? workArea.x + workArea.width - width : workArea.x;
  const targetY = workArea.y + Math.round((workArea.height - height) / 2);

  deckWindow.setBounds({
    x: targetX,
    y: targetY,
    width: width,
    height: height,
  });
}

// 1. CREATE FLOATING SCREEN-EDGE DECK WINDOW
function createDeckWindow() {
  const workArea = getDisplayBounds();
  const width = getTargetDeckWidth();
  const height = Math.min(740, workArea.height - 30);
  const posX = currentEdge === "right" ? workArea.x + workArea.width - width : workArea.x;
  const posY = workArea.y + Math.round((workArea.height - height) / 2);

  deckWindow = new BrowserWindow({
    width: width,
    height: height,
    x: posX,
    y: posY,
    title: "Peeky Task - Deck",
    frame: false,
    transparent: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: true,
    resizable: false,
    icon: path.join(__dirname, "assets", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  deckWindow.loadFile("index.html");

  deckWindow.once("ready-to-show", () => {
    deckWindow.show();
    if (isCardOpen) {
      deckWindow.webContents.send("open-card");
    }
  });

  deckWindow.on("closed", () => {
    deckWindow = null;
  });
}

// 2. CREATE FIRST-LAUNCH ONBOARDING WINDOW (Matching Screenshots 1, 2, 3)
function createOnboardingWindow() {
  if (onboardingWindow) {
    onboardingWindow.show();
    onboardingWindow.focus();
    return;
  }

  const workArea = getDisplayBounds();
  const width = Math.min(680, workArea.width - 60);
  const height = Math.min(500, workArea.height - 60);

  onboardingWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 540,
    minHeight: 420,
    title: "Peeky Task - Welcome",
    frame: false,
    backgroundColor: "#191C22",
    skipTaskbar: false,
    resizable: false,
    icon: path.join(__dirname, "assets", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  onboardingWindow.loadFile("onboarding.html");

  onboardingWindow.once("ready-to-show", () => {
    onboardingWindow.show();
    onboardingWindow.focus();
  });

  onboardingWindow.on("closed", () => {
    onboardingWindow = null;
  });
}

// 3. CREATE MAIN MANAGER WINDOW (Dark theme task dashboard)
function createManagerWindow(showImmediately = true) {
  if (managerWindow) {
    if (showImmediately) {
      managerWindow.show();
      managerWindow.focus();
    }
    return;
  }

  const workArea = getDisplayBounds();
  const width = Math.min(1140, workArea.width - 100);
  const height = Math.min(750, workArea.height - 60);

  managerWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 940,
    minHeight: 600,
    title: "Peeky Task",
    frame: true,
    backgroundColor: "#16181D",
    skipTaskbar: false,
    icon: path.join(__dirname, "assets", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  managerWindow.loadFile("manager.html");

  managerWindow.once("ready-to-show", () => {
    if (showImmediately) {
      managerWindow.show();
      managerWindow.focus();
    }
  });

  // Closing Manager Window only hides it so Deck stays alive!
  managerWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      managerWindow.hide();
    }
  });

  managerWindow.on("closed", () => {
    managerWindow = null;
  });
}

// 4. SYSTEM TRAY
function createTray() {
  const iconPath = path.join(__dirname, "assets", "app-icon.png");
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open Peeky Task Manager",
        click: () => {
          createManagerWindow(true);
        },
      },
      {
        label: "Show / Hide Edge Deck",
        click: () => {
          if (!deckWindow) {
            createDeckWindow();
          } else if (deckWindow.isVisible()) {
            deckWindow.hide();
          } else {
            deckWindow.show();
          }
        },
      },
      { type: "separator" },
      {
        label: "Stick to " + (currentEdge === "right" ? "Left Edge" : "Right Edge"),
        click: () => {
          currentEdge = currentEdge === "right" ? "left" : "right";
          repositionDeckWindow();
          if (deckWindow) {
            deckWindow.webContents.send("edge-changed", currentEdge);
          }
          createTray();
        },
      },
      {
        label: "Always on Top",
        type: "checkbox",
        checked: isAlwaysOnTop,
        click: (menuItem) => {
          isAlwaysOnTop = menuItem.checked;
          if (deckWindow) {
            deckWindow.setAlwaysOnTop(isAlwaysOnTop);
            deckWindow.webContents.send("always-on-top-changed", isAlwaysOnTop);
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit Peeky Task",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("Peeky Task - Screen edge sticky tasks & manager");
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      createManagerWindow(true);
    });
  } catch (err) {
    console.error("Failed to create tray:", err);
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (managerWindow) {
      if (managerWindow.isMinimized()) managerWindow.restore();
      managerWindow.show();
      managerWindow.focus();
    } else {
      createManagerWindow(true);
    }
    isCardOpen = true;
    repositionDeckWindow();
    if (deckWindow) {
      deckWindow.show();
      deckWindow.webContents.send("open-card");
    }
  });

  app.whenReady().then(() => {
    const userData = loadUserData();
    if (userData && (userData.edge === "left" || userData.edge === "right")) {
      currentEdge = userData.edge;
    } else {
      currentEdge = "right"; // default on right
    }

    isCardOpen = true;
    createDeckWindow();

    if (!userData || !userData.hasSeenOnboarding) {
      createOnboardingWindow();
    }

    createTray();

    try {
      globalShortcut.register("Alt+Space", () => {
        if (!managerWindow || !managerWindow.isVisible()) {
          createManagerWindow(true);
        } else {
          managerWindow.hide();
        }
      });
    } catch (e) {
      console.log("Could not register Alt+Space global shortcut:", e);
    }

    app.on("activate", () => {
      if (!managerWindow) {
        createManagerWindow(true);
      } else {
        managerWindow.show();
        managerWindow.focus();
      }
    });
  });
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Broadcast changes between Deck Window and Manager Window
function broadcastDataUpdate(data, senderWebContents) {
  if (deckWindow && deckWindow.webContents !== senderWebContents) {
    deckWindow.webContents.send("data-updated", data);
  }
  if (managerWindow && managerWindow.webContents !== senderWebContents) {
    managerWindow.webContents.send("data-updated", data);
  }
}

// IPC Handlers
ipcMain.on("launch-sticky-tasks", (event, edge) => {
  if (edge === "left" || edge === "right") {
    currentEdge = edge;
  } else {
    currentEdge = "right"; // default on right
  }

  if (onboardingWindow) {
    onboardingWindow.close();
    onboardingWindow = null;
  }

  if (managerWindow && managerWindow.isVisible()) {
    managerWindow.hide();
  }

  isCardOpen = true;
  repositionDeckWindow();

  if (deckWindow) {
    deckWindow.show();
    deckWindow.focus();
    deckWindow.webContents.send("edge-changed", currentEdge);
    deckWindow.webContents.send("open-card");
  }
});

ipcMain.on("open-manager", () => {
  createManagerWindow(true);
});

ipcMain.on("close-manager", () => {
  if (managerWindow) managerWindow.hide();
});

ipcMain.on("open-onboarding", () => {
  createOnboardingWindow();
});

ipcMain.on("window-close", (event) => {
  const sender = BrowserWindow.fromWebContents(event.sender);
  if (sender === managerWindow) {
    managerWindow.hide();
  } else if (sender === deckWindow) {
    deckWindow.hide();
  } else if (sender === onboardingWindow) {
    onboardingWindow.close();
  }
});

ipcMain.on("window-set-always-on-top", (event, alwaysOnTop) => {
  isAlwaysOnTop = !!alwaysOnTop;
  if (deckWindow) deckWindow.setAlwaysOnTop(isAlwaysOnTop);
});

ipcMain.on("dock-edge", (event, edge) => {
  if (edge === "left" || edge === "right") {
    currentEdge = edge;
    repositionDeckWindow();
  }
});

ipcMain.on("set-card-open", (event, open) => {
  isCardOpen = !!open;
  repositionDeckWindow();
});

ipcMain.on("set-deck-hovered", (event, hovered) => {
  isDeckHovered = !!hovered;
  repositionDeckWindow();
});

ipcMain.handle("data-load", async () => {
  return loadUserData();
});

ipcMain.handle("data-save", async (event, data) => {
  const ok = saveUserData(data);
  broadcastDataUpdate(data, event.sender);
  return ok;
});

ipcMain.on("open-external", (event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    shell.openExternal(url);
  }
});

ipcMain.on("open-data-folder", () => {
  shell.openPath(app.getPath("userData"));
});

ipcMain.handle("get-login-item-settings", () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("set-login-item-settings", (event, openAtLogin) => {
  try {
    app.setLoginItemSettings({ openAtLogin: !!openAtLogin });
    return app.getLoginItemSettings().openAtLogin;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("export-tasks-file", async (event, data) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const res = await dialog.showSaveDialog(win, {
      title: "Export Peeky Task Backup",
      defaultPath: "peeky-task-backup.json",
      filters: [{ name: "JSON Backup", extensions: ["json"] }],
    });
    if (!res.canceled && res.filePath) {
      fs.writeFileSync(res.filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    }
  } catch (err) {
    console.error("Error exporting backup:", err);
  }
  return false;
});

ipcMain.handle("import-tasks-file", async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const res = await dialog.showOpenDialog(win, {
      title: "Import Peeky Task Backup",
      filters: [{ name: "JSON Backup", extensions: ["json"] }],
      properties: ["openFile"],
    });
    if (!res.canceled && res.filePaths.length > 0) {
      const raw = fs.readFileSync(res.filePaths[0], "utf-8");
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.error("Error importing backup:", err);
  }
  return null;
});

