import { BrowserWindow, shell, app } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import log from 'electron-log';
import { getComputerDetails } from '../utils/computerDetails.js';
import { STORAGE_KEYS, ASSETS, WINDOW, SERVER, MESSAGES } from '../config/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ERP_URL = SERVER.localUrl;
const OFFLINE_PAGE = join(__dirname, '..', '..', ASSETS.offlinePage);
let win = null;
let quitting = false;

/* =====================================================
   LICENSE CHECK + EXPIRY + MACHINE VALIDATION
===================================================== */

export const createWindow = () => {
    win = new BrowserWindow({
        width: WINDOW.width,
        height: WINDOW.height,
        show: false,
        icon: join(__dirname, '..', '..', ASSETS.logo),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
    });

    log.info('[Window] BrowserWindow created — loading ERP');

    // Load the React app served by local Express
    win.loadURL(ERP_URL).catch((err) => {
        log.error('[Window] Initial load failed:', err.message);
    });

    // Show the window only after the first paint — avoids white flash on startup
    win.once('ready-to-show', () => {
        win.show();
        log.info('[Window] OPENED — visible to user');
    });

    // Log every navigation start
    win.webContents.on('did-start-loading', () => {
        log.info('[Window] Loading:', win.webContents.getURL());
    });

    // After every successful page load — inject PC info then check for white screen
    win.webContents.on('did-finish-load', () => {
        log.info('[Window] Page loaded:', win.webContents.getURL());

        // Inject machine info into localStorage so the React app can read it
        const pcInfo = getComputerDetails();
        const script = `
            localStorage.setItem('resourceInfo', ${JSON.stringify(JSON.stringify(pcInfo))});
        `;
        win.webContents.executeJavaScript(script).catch((err) => {
            log.warn(MESSAGES.window.injectFail, err.message);
        });

        checkForWhiteScreen();
    });

    // If the page fails to load — show the offline page instead
    win.webContents.on('did-fail-load', (_e, errCode, errDesc, failedURL) => {
        // Code -3 (ERR_ABORTED) is a normal browser cancel — not a real error
        if (errCode === -3) return;
        log.warn(`[Window] Load FAILED  code=${errCode}  desc=${errDesc}  url=${failedURL}`);
        win.loadFile(OFFLINE_PAGE).catch((err) => {
            log.error('[Window] Could not load offline page:', err.message);
        });
    });

    // When user clicks X — hide to tray instead of closing (unless app is quitting)
    win.on('close', (e) => {
        if (!quitting) {
            e.preventDefault();
            win.hide();
            log.info('[Window] Close intercepted — hidden to system tray');
        } else {
            // App is quitting — clear sensitive session data from localStorage first
            e.preventDefault();
            const clearScript = STORAGE_KEYS.map((k) => `localStorage.removeItem('${k}');`).join(
                '\n',
            );

            win.webContents
                .executeJavaScript(clearScript)
                .catch((err) => {
                    log.warn(MESSAGES.window.clearFail, err.message);
                })
                .finally(() => {
                    log.info('[Window] Session localStorage cleared — closing window');
                    win.destroy(); // destroy() bypasses the close event so no infinite loop
                });
        }
    });

    // Open any external links in the user's default browser (not inside Electron)
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        log.info('[Window] External link opened in browser:', url);
        return { action: 'deny' };
    });

    return win;
};

// -----------------------------------------------------------------------------
// checkForWhiteScreen  (private helper)
// Waits 3 s after page load then checks if <body> is empty.
// An empty body means React/Vue failed to mount — reload automatically.
// -----------------------------------------------------------------------------
export const checkForWhiteScreen = () => {
    setTimeout(() => {
        if (!win || win.isDestroyed()) return;

        win.webContents
            .executeJavaScript('document.body ? document.body.innerHTML.trim().length : -1')
            .then((len) => {
                if (len === 0) {
                    log.warn('[Window] WHITE SCREEN detected — reloading automatically');
                    reloadWindow();
                } else if (len > 0) {
                    log.info(`[Window] DOM OK (${len} chars)`);
                }
            })
            .catch(() => {
                // Window navigated away before the 3 s timer fired — this is fine
            });
    }, 3000);
};

// -----------------------------------------------------------------------------
// getWindow
// Returns the BrowserWindow instance (null before createWindow is called).
// -----------------------------------------------------------------------------
export const getWindow = () => {
    return win;
};

// -----------------------------------------------------------------------------
// showWindow
// Brings the window to the front. Called on tray click or second-instance.
// -----------------------------------------------------------------------------
export const showWindow = () => {
    if (!win) return;
    win.show();
    win.focus();
    log.info('[Window] Restored and focused');
};

// -----------------------------------------------------------------------------
// setQuitting
// Call with true just before app.quit() so the 'close' event lets the
// window close normally instead of hiding to tray.
// -----------------------------------------------------------------------------
export const setQuitting = (value) => {
    quitting = value;
    log.info('[Window] Quit mode:', value);
};

// -----------------------------------------------------------------------------
// reloadWindow
// Reloads the ERP URL. Falls back to the offline page if the load fails.
// -----------------------------------------------------------------------------
export const reloadWindow = async () => {
    if (!win || win.isDestroyed()) return;
    log.info('[Window] Reloading ERP URL...');
    try {
        await win.loadURL(ERP_URL);
        log.info('[Window] Reload successful');
    } catch (err) {
        log.warn('[Window] Reload failed — loading offline page:', err.message);
        win.loadFile(OFFLINE_PAGE).catch(() => { });
    }
};
