# Peeky Task
### Minimalist, screen-edge floating daily task widget for Windows.

<div align="center">

![status](https://img.shields.io/badge/status-active-22C55E?style=flat-square)
![platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D4?style=flat-square)
![framework](https://img.shields.io/badge/framework-Electron%2033-47848F?style=flat-square)
![package](https://img.shields.io/badge/package-MSIX%20%2F%20AppX-6366F1?style=flat-square)
![built with](https://img.shields.io/badge/built%20with-JavaScript%20%7C%20HTML%20%7C%20CSS-F59E0B?style=flat-square)

</div>

---

## Overview

**Peeky Task** is a lightweight, floating daily task widget designed to live quietly on the edge of your screen. Built with Windows 11 Fluent Design principles, Peeky Task provides a frictionless to-do list experience that stays out of your way until you need it. When idle, it rests as ultra-thin color slivers flush against your screen bezel; when touched or hovered, it fans out into interactive sticky tabs with real-time checklist progress, markdown checklists, and a full task management dashboard.

---

## Features

- **Screen-Edge Rested & Hover States** — Collapses into 7px color pill slivers flush against the screen bezel when idle; fans out smoothly into full tabs when touched.
- **Interactive Checklists** — Click anywhere on `- [ ] ` or `- [x] ` to check off tasks with immediate strikethrough and progress bar animation.
- **Dynamic Task Progress Bar** — Subtle 2.5px progress meter under the card header that fills dynamically and turns emerald green upon completion.
- **Glanceable Rail Stats** — Sticky tabs on your screen bezel display completion ratios (`Groceries · 2/3` or `✓ Groceries`) without opening the card.
- **Quick Keyboard Flow** — Hitting `Enter` automatically continues `- [ ] ` for seamless typing; hitting `Enter` on an empty checkbox cleans it up and exits list mode.
- **Screen Edge Docking** — Dock your tasks to either the **Right edge** (default) or **Left edge** with a single click.
- **8 Signature Pastel Swatches** — Mint, Sky, Butter, Peach, Blush, Lilac, Blue, Slate with active swatch highlight.
- **10-Second Undo Protection** — Deleting tasks provides a non-blocking toast with a draining progress bar to restore accidental deletions.
- **Full Task Dashboard** — Press `Alt + Space` anywhere in Windows or click `⊞` to open the full manager window with search, filtering (All, On Deck, Completed), and markdown export.
- **100% Offline & Private** — All data is stored locally in `%APPDATA%/PeekyTask/peeky-task-data.json`. Zero telemetry, zero cloud tracking.

---

## How It Works

- **Native Transparent Overlay:** A transparent, click-through overlay window lives on the edge of your display (`left` or `right`).
- **3-Tier Window Resizing Engine:** Sizes dynamically between 16px (rested pills), 44px (hovered tabs with action controls), and 530px (open floating card).
- **Smooth Leave Timer:** Built with a 350ms debounce leave timer that smoothly collapses tabs back to rested mode when mouse departs.
- **Dual-Window Data Synchronization:** IPC broadcast engine ensures instant bidirectional synchronization between the screen-edge sticky widget and the full manager dashboard.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Electron 33 | Desktop runtime & window management |
| Node.js | Local file I/O & IPC communications |
| HTML5 / Vanilla CSS | High-performance, GPU-accelerated UI rendering |
| JavaScript (ES6+) | Core task state management & keyboard handlers |
| electron-builder | Windows MSIX / AppX packaging for Microsoft Store |

---

## Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone repository
git clone https://github.com/Pro-Prince/peeky-task-app.git
cd peeky-task-app

# Install dependencies
npm install

# Start the application
npm start
```

---

## Packaging for Microsoft Store (MSIX / AppX)

To generate production binaries and an upload-ready `.appx` bundle for the Microsoft Partner Center:

```bash
npm run build
```

The output packages will be created inside the `release/` directory:
- `Peeky Task 1.0.0.appx` (Certified Windows Store upload package)
- `Peeky Task Setup 1.0.0.exe` (Standalone Windows NSIS installer)
- `win-unpacked/` (Direct unpacked executable)

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Space` | Toggle Full Task Manager |
| `Ctrl + N` | New Task List |
| `Ctrl + .` | Cycle Card Color Palette |
| `Escape` | Tuck / Close Floating Card |
| `Tab` / `Shift + Tab` | Indent / Outdent Checklist Item |

---

## Author

**Prince Patel** — CS Student & Builder

- Portfolio: https://prince-patel-portfolio.vercel.app
- GitHub: https://github.com/Pro-Prince
- X: https://x.com/Pro_Prince_1
- LinkedIn: https://www.linkedin.com/in/prince-patel476/

---

## License

This project is licensed under the MIT License.
