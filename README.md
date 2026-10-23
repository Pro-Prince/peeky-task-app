<div align="center">

# Peeky Task
### Minimalist, screen-edge floating daily task and to-do widget for Windows.

![Status](https://img.shields.io/badge/status-active-22C55E?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-6366F1?style=flat-square)
![Framework](https://img.shields.io/badge/framework-Electron%2033-22D3EE?style=flat-square)
![Packaging](https://img.shields.io/badge/package-MSIX%20%2F%20AppX-525252?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-F59E0B?style=flat-square)

**[→ Get on Microsoft Store](https://apps.microsoft.com/search?query=Peeky+Task)**

</div>

---

## Overview

Peeky Task is a minimalist, transparent daily task and to-do widget built natively for Windows 10 & 11 that lives quietly on the edge of your screen. Instead of forcing you to switch windows or cluttering your taskbar with heavy project management suites, Peeky Task stays completely out of your way until you need it. When at rest, it collapses into ultra-thin 7px pastel color pills flush against your screen bezel; when hovered or touched, it smoothly fans out into leaning interactive sticky tabs with real-time checklist progress, markdown checklists, and a full task management dashboard. 100% offline, zero telemetry, and never interrupts your flow.

---

## Microsoft Store

🔗 **[apps.microsoft.com/search?query=Peeky+Task](https://apps.microsoft.com/search?query=Peeky+Task)**

> Packaged as a certified Windows Store MSIX/AppX application. 100% local, isolated sandbox, automatic updates, and zero background telemetry.

---

## Features

- **Screen-Edge Rested & Hover States** — collapses into tiny 7px vertical color slivers flush against the screen bezel when idle; fans out smoothly into full tabs with action buttons when touched
- **Interactive Checklists** — click directly on `- [ ] ` or `- [x] ` to check off tasks with immediate strikethrough, haptic visual feedback, and animated progress updates
- **Dynamic Task Progress Bar** — subtle progress meter right under the card header that fills dynamically and turns emerald green when all tasks are complete
- **Glanceable Rail Stats** — sticky tabs on your screen bezel display completion ratios (`Groceries · 2/3` or `✓ Groceries`) without opening the card
- **Frictionless Keyboard Flow** — pressing `Enter` automatically continues `- [ ] ` for seamless typing; pressing `Enter` on an empty checkbox cleans it up and exits list mode
- **Screen Edge Docking** — dock your tasks to either the **Right edge** (default) or **Left edge** with a single click
- **8 Signature Pastel Swatches** — Mint, Sky, Butter, Peach, Blush, Lilac, Blue, and Slate with active swatch highlight
- **10-Second Undo Protection** — deleting tasks provides a non-blocking toast with an animated draining progress bar to restore accidental deletions
- **Full Task Dashboard** — press `Alt + Space` anywhere in Windows or click `⊞` to open the full manager window with search, filtering (All, On Deck, Completed), and markdown export
- **100% Offline & Private** — all data is stored locally on your PC in `%APPDATA%/PeekyTask/peeky-task-data.json`. Zero telemetry, zero cloud tracking

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Electron 33 | Desktop runtime and multi-window management |
| Node.js | Local file persistence and IPC synchronization |
| HTML5 & Vanilla CSS | GPU-accelerated, transparent desktop overlay rendering |
| JavaScript (ES6+) | Core task state management and keyboard ergonomics |
| electron-builder | Windows MSIX / AppX packaging for Microsoft Store |

---

## Architecture

- **Transparent Overlay Canvas:** A transparent, click-through overlay window lives on the edge of the active display (`left` or `right`), preventing desktop interaction blocking while idle.
- **Dynamic 3-Tier Window Resizing Engine:** Window bounds dynamically transition between 16px (rested pills), 44px (hovered tabs with action controls), and 530px (open floating card).
- **Debounced Leave Timer:** A 350ms leave timer collapses tabs back to rested mode when the mouse leaves, preventing accidental dismissals.
- **Dual-Window Data Synchronization:** IPC broadcast engine ensures instant bidirectional synchronization between the screen-edge sticky widget and the full manager dashboard.
- **Local JSON Persistence:** All task state, colors, order, and completion timestamps are saved atomically to the local app data folder with automatic corrupted file fallbacks.

---

## Challenges Solved

**1. Window transparency without click blocking**
Traditional desktop widgets block mouse clicks across their entire rectangular frame even when parts are transparent. Peeky Task uses dynamic window sizing combined with CSS pointer-event choreography, resizing the OS window bounds between 16px when idle and 530px when editing so you can click underneath transparent areas freely.

**2. Fluid rested-to-hover transitions**
Desktop widgets that pop in and out abruptly feel jarring. A two-stage CSS transition pairs tiny 7px pill slivers with rotated uppercase labels that fan out smoothly when touched, controlled by a 350ms debounce leave timer.

**3. Keyboard ergonomics for rapid checklist creation**
In traditional note apps, creating checklists requires clicking buttons or typing full syntax repeatedly. Peeky Task intercepts `Enter`, `Tab`, and `Backspace` to automatically continue checkboxes, handle sub-task indentation, and cleanly exit list mode on empty lines.

**4. Dual-mode desktop coexistence**
Users need quick access to sticky notes while also wanting a searchable master archive. The architecture splits the app into an always-on-top screen edge Deck and an on-demand full Manager (`Alt + Space`), synced in real time via an internal IPC event bus.

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

## Web Showcase

The official website & interactive demo for Peeky Task is live.

🔗 **[peeky-task.vercel.app](https://peeky-task.vercel.app/)**<br>
📂 **[Web Repository](https://github.com/Pro-Prince/peeky-task-web)**

---

## Author

**Prince Patel** — AI-Powered Product Developer

- 🌐 Portfolio: [prince-patel-portfolio.vercel.app](https://prince-patel-portfolio.vercel.app)
- 🐙 GitHub: [github.com/Pro-Prince](https://github.com/Pro-Prince)
- 𝕏 X: [@Pro_Prince_1](https://x.com/Pro_Prince_1)
- 💼 LinkedIn: [linkedin.com/in/prince-patel476](https://www.linkedin.com/in/prince-patel476/)

---

## License

This project is licensed under the MIT License.
