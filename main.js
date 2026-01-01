const { app, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");

/**
 * Retrieves PC details such as hostname, username, IPv4 address, and MAC address.
 * @returns {Object} PC details.
 */
function getPCDetails() {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = "N/A";
  let macAddress = "N/A";

  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        ipAddress = config.address;
        macAddress = config.mac;
        break;
      }
    }
    if (ipAddress !== "N/A") break;
  }

  return {
    pcName: os.hostname(),
    username: os.userInfo().username,
    ipAddress,
    macAddress,
  };
}

let mainWindow;

/**
 * Creates the main application window, loads the frontend URL,
 * injects PC information into the window's localStorage,
 * and manages window events.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "logo.ico"),
    show: false, // Show after content & script load
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const frontendUrl = "https://app.demo.nilkanthmedico.in";
  mainWindow.loadURL(frontendUrl);

  // Inject PC info after page loads
  mainWindow.webContents.on("did-finish-load", () => {
    const pcInfo = getPCDetails();
    const script = `
      localStorage.setItem('navType','DEFAULT');
      localStorage.setItem('resourceInfo', ${JSON.stringify(
      JSON.stringify(pcInfo)
    )});
    `;
    mainWindow.webContents
      .executeJavaScript(script)
      .then(() => {
        mainWindow.show();
      })
      .catch((err) => {
        console.error("Failed to inject PC info:", err);
        mainWindow.show();
      });
  });

  // Clear localStorage on window close, then quit app gracefully
  mainWindow.on("close", (event) => {
    if (mainWindow && mainWindow.webContents) {
      event.preventDefault();
      const clearScript = `
      localStorage.removeItem('indoorId');
      localStorage.removeItem('billNo');
      localStorage.removeItem('patientBillId');
      localStorage.removeItem('isUpdate');
      localStorage.removeItem('dischargeCardId');
      localStorage.removeItem('receiptId');
      localStorage.removeItem('endoLaproImageId');`;
      mainWindow.webContents
        .executeJavaScript(clearScript)
        .then(() => {
          mainWindow = null;
          app.quit();
        })
        .catch((err) => {
          console.error("Failed to clear localStorage on window close:", err);
          mainWindow = null;
          app.quit();
        });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App ready: create window
app.whenReady().then(createWindow);

// macOS specific behaviour: recreate window if none are open
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit app when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Ensure localStorage clearing before app quits (fallback)
app.on("before-quit", (event) => {
  if (mainWindow && mainWindow.webContents) {
    event.preventDefault();
    const clearScript = `localStorage.clear();`;
    mainWindow.webContents
      .executeJavaScript(clearScript)
      .finally(() => {
        app.exit(0);
      });
  }
});
