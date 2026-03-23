import log from 'electron-log';

export const registerCrashHandlers = (getWindowFn, reloadFn, appRef) => {
    const win = getWindowFn();

    if (!win) {
        log.warn('[Crash] Window not ready — crash handlers not registered');
        return;
    }

    // --- Renderer process gone (crash or OOM) ----------------------------------
    win.webContents.on('render-process-gone', (_event, details) => {
        log.error(
            `[Crash] Renderer gone — reason: ${details.reason}  exitCode: ${details.exitCode}`,
        );
        if (details.reason === 'crashed' || details.reason === 'oom') {
            log.error('[Crash] Critical failure — relaunching app now');
            appRef.relaunch();
            appRef.exit(0);
        } else {
            log.warn(`[Crash] Renderer exited (${details.reason}) — reloading in 2 s`);
            setTimeout(() => reloadFn(), 2000);
        }
    });

    // --- Renderer frozen / unresponsive ----------------------------------------
    win.webContents.on('unresponsive', () => {
        log.warn('[Crash] Renderer is UNRESPONSIVE — will reload in 5 s if still frozen');
        setTimeout(() => {
            if (win && !win.isDestroyed()) {
                log.warn('[Crash] Still unresponsive — forcing reload');
                reloadFn();
            }
        }, 5000);
    });

    // Log when the renderer recovers on its own
    win.webContents.on('responsive', () => {
        log.info('[Crash] Renderer is responsive again');
    });

    // --- Main process safety net -----------------------------------------------
    process.on('uncaughtException', (err) => log.error('[Crash] Uncaught exception:', err));
    process.on('unhandledRejection', (reason) => log.error('[Crash] Unhandled rejection:', reason));
    log.info('[Crash] Crash handlers registered');
};
