/**
 * ---------------------------------------------------------
 *  Nilkanth Medico Hospital ERP - Electron Main Process
 *  Production Optimized for Hospital Systems (24×7 usage)
 * ---------------------------------------------------------
 */

import { app, session } from 'electron';
import os from 'os';
import log from 'electron-log';
import { createWindow, getWindow, showWindow, reloadWindow } from './src/electron/windowManager.js';
import { registerCrashHandlers } from './src/electron/crashHandler.js';

/* ---------------------------------------------------------
   LOGGING SYSTEM
   Hospital ERP debugging & monitoring
--------------------------------------------------------- */
log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.file.archiveLog = true;

/* ---------------------------------------------------------
   ELECTRON PERFORMANCE FLAGS
   Disable unnecessary Chromium services
--------------------------------------------------------- */
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Limit disk cache to 100MB
app.commandLine.appendSwitch('disk-cache-size', '104857600');

/* ---------------------------------------------------------
   RAM BASED MEMORY OPTIMIZATION
   Adjust JS memory usage based on computer RAM
--------------------------------------------------------- */
const totalRam = os.totalmem() / (1024 * 1024 * 1024);
if (totalRam <= 4) {
    // Low RAM hospital computers
    log.info('[Performance] Low RAM system detected');
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
} else if (totalRam <= 8) {
    // Mid range systems
    log.info('[Performance] Medium RAM system detected');
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=1024');
} else {
    // High end computers
    log.info('[Performance] High RAM system detected');
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
}

/* ---------------------------------------------------------
   GPU DISABLE (Important for Old Hospital PCs)
   Prevent white screen & GPU crashes
--------------------------------------------------------- */

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

/* ---------------------------------------------------------
   SINGLE INSTANCE LOCK
   Prevent multiple ERP instances
--------------------------------------------------------- */

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    log.warn('[App] Already running — second instance exiting');
    app.quit();
} else {
    /* ---------------------------------------------------------
 HANDLE SECOND INSTANCE
 Restore existing window
--------------------------------------------------------- */

    app.on('second-instance', (_event, argv, _workingDir) => {
        log.info('[App] Second instance blocked — argv:', argv.join(' '));
        const win = getWindow();
        if (!win) return;
        // Restore from minimized / hidden state
        if (win.isMinimized()) win.restore();
        if (!win.isVisible()) win.show();
        win.focus();
        // Flash the taskbar button so the user notices (Windows)
        win.flashFrame(true);
        setTimeout(() => win.flashFrame(false), 3000);
        log.info('[App] Existing window restored and focused for second-instance request');
    });

    app.whenReady().then(async () => {
        log.info('='.repeat(60));
        log.info('[App] Nilkanth Medico Hospital ERP  —  STARTING');
        log.info(
            `[App] Electron v${process.versions.electron}  |  Node v${process.versions.node}  |  PID ${process.pid}`,
        );
        log.info('='.repeat(60));

        // session
        await session.defaultSession.clearCache();
        await session.defaultSession.clearStorageData();

        createWindow();

        //  CRASH HANDLER Prevent white screen
        registerCrashHandlers(getWindow, reloadWindow, app);

        log.info('[App] All modules ready  —  ERP is RUNNING');
    });

    // --- macOS: clicking the dock icon restores the window ---------------------
    app.on('activate', () => showWindow());

    // --- Keep app alive in tray even when all windows are closed ---------------
    app.on('window-all-closed', () => {
        log.info('[App] All windows closed  —  app is still running in system tray');
    });

    // --- Clean up before the process exits -------------------------------------
    app.on('before-quit', () => {
        log.info('[App] Shutting down...');
    });

    app.on('quit', () => {
        log.info('[App] Nilkanth Medico Hospital ERP  —  CLOSED');
        log.info('='.repeat(60));
    });
}
