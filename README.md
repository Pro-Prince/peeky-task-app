# Peeky Task — Windows Desktop Application

A minimalist, floating daily task widget for Windows 10 & 11, designed to live quietly on the edge of your screen.

## Features
- **Floating Edge Widget:** Transparent acrylic/glassmorphism design matching Windows 11 Fluent Design.
- **Always on Top Toggle:** Pin icon to keep the widget floating over other apps or sit on the desktop layer.
- **Collapse to Pill:** Shrink to a minimal pill when not actively interacting.
- **The Rule of 3:** Filter button to toggle between your top 3 daily focus tasks and all tasks.
- **8 Custom Tag Colors:** Butter, Blue, Mint, Blush, Lilac, Peach, Sky, Slate with one-click color cycling.
- **10-Second Undo:** Deleting tasks shows a non-blocking toast with an animated drain bar so you can undo accidental deletions.
- **100% Offline & Private:** Stored locally in `%APPDATA%/PeekyTask/peeky-task-data.json`. Zero telemetry, zero cloud upload.
- **7-Day Free Trial & Dodo Licensing:** Automatically handles the 7-day countdown and unlocks permanently when a valid license key is entered in Settings.
- **Global Shortcut:** Press `Alt + Space` anywhere in Windows to toggle visibility.

## Running Locally
```bash
npm install
npm start
```

## Packaging for Microsoft Store (MSIX)
To package into a certified Windows MSIX / AppX bundle for Microsoft Partner Center:
```bash
npm run build:msix
```
The output `.msix` / `.appx` bundle will be generated inside the `dist/` directory, ready to upload directly to Microsoft Partner Center.
