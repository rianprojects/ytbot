const { app, BrowserWindow, Tray, Menu, shell, nativeImage } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow = null;
let tray = null;
let serverProcess = null;

const PORT = 3001;
const URL = `http://localhost:${PORT}`;
const isDev = !app.isPackaged;

function getIcon() {
  const iconPath = path.join(__dirname, "build", "icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  return icon.isEmpty() ? nativeImage.createEmpty() : icon;
}

function startServer() {
  const serverDir = path.join(__dirname, "..", "server");
  const serverEntry = path.join(serverDir, "index.js");

  const clientDist = isDev
    ? path.join(__dirname, "..", "client", "dist")
    : path.join(process.resourcesPath, "client", "dist");

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      CLIENT_DIST: clientDist,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (d) => console.log("[server]", d.toString().trim()));
  serverProcess.stderr.on("data", (d) => console.error("[server]", d.toString().trim()));
  serverProcess.on("error", (err) => console.error("Server spawn error:", err));
  serverProcess.on("exit", (code) => {
    console.log("Server exited with code", code);
    serverProcess = null;
  });
}

function waitForServer(attempts = 30) {
  return new Promise((resolve, reject) => {
    const http = require("http");
    let tries = 0;

    function check() {
      http
        .get(URL, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (++tries >= attempts) return reject(new Error("Server failed to start"));
          setTimeout(check, 500);
        });
    }
    check();
  });
}

function createTray() {
  tray = new Tray(getIcon());
  tray.setToolTip("YouTube Downloader");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Dashboard", click: openDashboard },
    { type: "separator" },
    { label: "Quit", click: quitApp },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", openDashboard);
}

function openDashboard() {
  shell.openExternal(URL);
}

function quitApp() {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
}

app.whenReady().then(async () => {
  startServer();
  await waitForServer();
  createTray();
  console.log("ytbot running in tray:", URL);
});

// Keep running in tray even when all windows closed
app.on("window-all-closed", () => {});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
