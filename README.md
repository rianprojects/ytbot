# YouTube Downloader (ytbot)

Download video (MP4) atau audio (MP3) dari YouTube. Berjalan di system tray (background), tanpa jendela console.

## Fitur
- Download video MP4 (pilih resolusi) atau audio MP3 (128/192/256 kbps)
- Berjalan di system tray — klik kanan icon untuk buka dashboard atau quit
- UI React + Tailwind, backend Express + yt-dlp

## Install (Windows)
1. Download installer terbaru dari [Releases](https://github.com/rianprojects/ytbot/releases)
2. Jalankan `YouTube Downloader Setup x.x.x.exe`
3. Setelah install, app otomatis jalan di tray. Klik icon tray untuk buka dashboard di browser

**Requirement:** [yt-dlp](https://github.com/yt-dlp/yt-dlp) harus ada di PATH.

## Development

```bash
# server
cd server && npm install && npm start

# client
cd client && npm install && npm run dev
```

Atau jalankan `start.bat` untuk start server + client sekaligus (mode dev, dengan console).

## Build installer sendiri

```bash
npm install
npm run build:win
```

Installer akan ada di folder `dist-installer/`.

## Struktur

```
client/    - React + Vite frontend
server/    - Express API (yt-dlp wrapper)
electron/  - Electron tray app + main process
```
