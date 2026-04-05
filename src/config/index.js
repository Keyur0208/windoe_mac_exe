// ---------------------------------------------------------------------------
// APP  —  branding / identity
// ---------------------------------------------------------------------------
export const APP = {
    name: 'Nilkanth Medico ERP',
    productName: 'Nilkanth Medico',
    company: 'Nilkanth Medico Private Limited',
    website: 'https://nilkanthmedico.com',
    supportEmail: 'support@nilkanthmedico.com',
};

// ---------------------------------------------------------------------------
// ASSETS  —  relative paths from the project root (Electron __dirname aware)
// ---------------------------------------------------------------------------
export const ASSETS = {
    logo: 'logo.ico', // system-tray icon  (join __dirname, '../logo.ico')
    offlinePage: 'public/offline.html',
};

// ---------------------------------------------------------------------------
// SERVER  —  local Express server
// ---------------------------------------------------------------------------
export const SERVER = {
    port: 8081,
    localUrl: 'http://192.168.1.135:8081',
    serverlUrl: 'http://192.168.1.135:1111',
};

// ---------------------------------------------------------------------------
// WINDOW  —  BrowserWindow defaults
// ---------------------------------------------------------------------------
export const WINDOW = {
    width: 1400,
    height: 900,
    whiteScreenMs: 3000, // wait before checking if DOM is empty after load
};

// ---------------------------------------------------------------------------
// WATCHDOG  —  nightly scheduled relaunch + memory limit guard
// ---------------------------------------------------------------------------
export const WATCHDOG = {
    relaunchHour: 3, // 3:00 AM  — scheduled daily auto-relaunch
    relaunchMinute: 0, // :00 minutes — specific time for relaunch
    maxMemoryMB: 512, // relaunch if process RSS exceeds this (MB)
    idleMinutes: 0, // 0 min for instant testing (no idle wait needed)
    checkIntervalMs: 10_000, // 10 s check interval for dev testing (faster feedback)
};

// ---------------------------------------------------------------------------
// MESSAGES  —  all user-visible dialog strings in one place
// ---------------------------------------------------------------------------
export const MESSAGES = {
    crash: {
        relaunchLog: '[Crash] Critical failure — relaunching app now',
        reloadLog: (reason) => `[Crash] Renderer exited (${reason}) — reloading in 2 s`,
        unresponsive: '[Crash] Renderer is UNRESPONSIVE — will reload in 5 s if still frozen',
        responsive: '[Crash] Renderer is responsive again',
    },
    window: {
        whiteScreen: '[Window] WHITE SCREEN detected — reloading automatically',
        clearFail: '[Window] Could not clear localStorage on close',
        injectFail: '[Window] Could not inject PC info into localStorage',
    },
};

// ---------------------------------------------------------------------------
// STORAGE_KEYS  —  localStorage keys that hold sensitive session data
// These are cleared automatically when the app quits.
// ---------------------------------------------------------------------------
export const STORAGE_KEYS = [
    'indoorId',
    'billNo',
    'patientBillId',
    'isUpdate',
    'dischargeCardId',
    'receiptId',
    'endoLaproImageId',
];
