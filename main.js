const { app, BrowserWindow, ipcMain, screen, Tray, Menu, globalShortcut, shell } = require("electron");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

let deckWindow = null;
let noteWindow = null;
let managerWindow = null;
let onboardingWindow = null;
let tray = null;
let isAlwaysOnTop = true;
let currentEdge = "right"; // "left" | "right"
let isDeckHovered = false;
let isDeckPeeking = false;

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
  if (isDeckHovered) return 290; // expanded to show vertical tab labels + attached peek preview card
  return 24;                     // rested flush slivers
}

function repositionDeckWindow() {
  if (!deckWindow) return;
  const workArea = getDisplayBounds();
  const width = getTargetDeckWidth();
  const height = Math.min(680, workArea.height - 30);
  const targetX = currentEdge === "right" ? workArea.x + workArea.width - width : workArea.x;
  const targetY = workArea.y + Math.round((workArea.height - height) / 2);

  deckWindow.setBounds({
    x: targetX,
    y: targetY,
    width: width,
    height: height,
  });
}

// 1. CREATE SCREEN-EDGE DECK WINDOW
function createDeckWindow() {
  const workArea = getDisplayBounds();
  const width = getTargetDeckWidth();
  const height = Math.min(680, workArea.height - 30);
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
    roundedCorners: false,
    thickFrame: false,
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
  });

  deckWindow.on("closed", () => {
    deckWindow = null;
  });
}

// 2. CREATE CENTERED FLOATING TASK CARD WINDOW (Matching Image 5)
function createNoteWindow() {
  if (noteWindow) return;

  const workArea = getDisplayBounds();
  const width = 380;
  const height = 380;
  const posX = Math.round(workArea.x + (workArea.width - width) / 2);
  const posY = Math.round(workArea.y + (workArea.height - height) / 2);

  noteWindow = new BrowserWindow({
    width: width,
    height: height,
    x: posX,
    y: posY,
    title: "Peeky Task",
    frame: false,
    transparent: true,
    hasShadow: true,
    roundedCorners: true,
    backgroundColor: "#00000000",
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: false,
    resizable: false,
    show: false,
    icon: path.join(__dirname, "assets", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  noteWindow.loadFile("note.html");

  noteWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      noteWindow.hide();
    }
  });

  noteWindow.on("closed", () => {
    noteWindow = null;
  });
}

function showNoteCard(noteId) {
  if (!noteWindow) {
    createNoteWindow();
  }
  if (noteId && noteWindow.webContents) {
    noteWindow.webContents.send("show-note-card", noteId);
  }
  noteWindow.show();
  noteWindow.focus();
}

// 3. CREATE FIRST-LAUNCH ONBOARDING WINDOW
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

// 4. CREATE MAIN MANAGER WINDOW
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

// 5. SYSTEM TRAY
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
          const userData = loadUserData() || {};
          userData.edge = currentEdge;
          saveUserData(userData);
          repositionDeckWindow();
          if (deckWindow) {
            deckWindow.webContents.send("edge-changed", currentEdge);
          }
          broadcastDataUpdate(userData);
          createTray();
        },
      },
      {
        label: "Always on Top",
        type: "checkbox",
        checked: isAlwaysOnTop,
        click: (menuItem) => {
          isAlwaysOnTop = menuItem.checked;
          if (deckWindow) deckWindow.setAlwaysOnTop(isAlwaysOnTop);
          if (noteWindow) noteWindow.setAlwaysOnTop(isAlwaysOnTop);
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

// Broadcast changes across all windows
function broadcastDataUpdate(data, senderWebContents) {
  if (deckWindow && deckWindow.webContents !== senderWebContents) {
    deckWindow.webContents.send("data-updated", data);
  }
  if (managerWindow && managerWindow.webContents !== senderWebContents) {
    managerWindow.webContents.send("data-updated", data);
  }
  if (noteWindow && noteWindow.webContents !== senderWebContents) {
    noteWindow.webContents.send("data-updated", data);
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
  });

  app.whenReady().then(() => {
    const userData = loadUserData();
    if (userData && (userData.edge === "left" || userData.edge === "right")) {
      currentEdge = userData.edge;
    } else {
      currentEdge = "right"; // default on right
    }

    if (userData && userData.launchAtStartup !== undefined) {
      try {
        app.setLoginItemSettings({ openAtLogin: !!userData.launchAtStartup });
      } catch (e) {}
    }

    createDeckWindow();
    createNoteWindow();

    if (!userData || !userData.hasSeenOnboarding) {
      createOnboardingWindow();
    } else {
      showNoteCard();
    }

    createTray();

    try {
      // 1. Alt+Space: Toggle centered task card
      globalShortcut.register("Alt+Space", () => {
        if (noteWindow && noteWindow.isVisible()) {
          noteWindow.hide();
        } else {
          showNoteCard();
        }
      });

      // 2. Ctrl+Alt+T: Quick add task (opens centered note and focuses quick add)
      globalShortcut.register("CommandOrControl+Alt+T", () => {
        showNoteCard();
        if (noteWindow) {
          noteWindow.webContents.send("focus-quick-add");
        }
      });

      // 3. Ctrl+Alt+A: All tasks manager
      globalShortcut.register("CommandOrControl+Alt+A", () => {
        createManagerWindow(true);
      });
    } catch (e) {
      console.log("Could not register global shortcuts:", e);
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

// IPC Handlers
ipcMain.on("launch-sticky-tasks", (event, edge) => {
  if (edge === "left" || edge === "right") {
    currentEdge = edge;
  } else {
    currentEdge = "right";
  }

  const userData = loadUserData() || {};
  userData.edge = currentEdge;
  userData.hasSeenOnboarding = true;
  saveUserData(userData);

  if (onboardingWindow) {
    onboardingWindow.close();
    onboardingWindow = null;
  }

  if (managerWindow && managerWindow.isVisible()) {
    managerWindow.hide();
  }

  repositionDeckWindow();

  if (deckWindow) {
    deckWindow.show();
    deckWindow.webContents.send("edge-changed", currentEdge);
  }
  showNoteCard();
  broadcastDataUpdate(userData, event.sender);
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

ipcMain.on("open-note-card", (event, noteId) => {
  showNoteCard(noteId);
});

ipcMain.on("close-note-card", () => {
  if (noteWindow) noteWindow.hide();
});

ipcMain.on("window-close", (event) => {
  const sender = BrowserWindow.fromWebContents(event.sender);
  if (sender === managerWindow) {
    managerWindow.hide();
  } else if (sender === deckWindow) {
    deckWindow.hide();
  } else if (sender === noteWindow) {
    noteWindow.hide();
  } else if (sender === onboardingWindow) {
    onboardingWindow.close();
  }
});

ipcMain.on("window-set-always-on-top", (event, alwaysOnTop) => {
  isAlwaysOnTop = !!alwaysOnTop;
  if (deckWindow) deckWindow.setAlwaysOnTop(isAlwaysOnTop);
  if (noteWindow) noteWindow.setAlwaysOnTop(isAlwaysOnTop);
});

ipcMain.on("dock-edge", (event, edge) => {
  if (edge === "left" || edge === "right") {
    currentEdge = edge;
    const userData = loadUserData() || {};
    userData.edge = edge;
    saveUserData(userData);
    repositionDeckWindow();
    if (deckWindow) {
      deckWindow.webContents.send("edge-changed", currentEdge);
    }
    broadcastDataUpdate(userData, event.sender);
  }
});

ipcMain.on("set-deck-hovered", (event, hovered) => {
  if (isDeckHovered !== !!hovered) {
    isDeckHovered = !!hovered;
    repositionDeckWindow();
  }
});

ipcMain.on("set-deck-peeking", (event, peeking) => {
  isDeckPeeking = !!peeking;
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
  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:"))) {
    shell.openExternal(url);
  }
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
    const userData = loadUserData() || {};
    userData.launchAtStartup = !!openAtLogin;
    saveUserData(userData);
    return app.getLoginItemSettings().openAtLogin;
  } catch (e) {
    return false;
  }
});
