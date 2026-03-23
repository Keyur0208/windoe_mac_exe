import { powerMonitor, session } from 'electron';
import log from 'electron-log';
import { WATCHDOG } from '../config/index.js';
import { today, currentHour, currentMinute } from '../utils/dateTime.js';
import { stopServer } from '../../server.js';

let checkInterval = null;
let lastRelaunchDate = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Total process memory (RSS) in MB — includes heap + native + GPU shared
const getMemoryMB = () => Math.round(process.memoryUsage().rss / (1024 * 1024));

// True when the user has not touched the keyboard/mouse for the idle threshold
const isSystemIdle = () => powerMonitor.getSystemIdleTime() >= WATCHDOG.idleMinutes * 60;

// True if it is the scheduled hour AND we have not already relaunched today
const isScheduledTime = () => {
    const todayStr = today(); // 'YYYY-MM-DD' — ISO, stable across locales
    if (lastRelaunchDate === todayStr) return false; // already relaunched today
    return currentHour() === WATCHDOG.relaunchHour && currentMinute() === WATCHDOG.relaunchMinute;
};

// ---------------------------------------------------------------------------
// doRelaunch  (private)
// ---------------------------------------------------------------------------
const doRelaunch = async (reason, appRef) => {
    await stopServer();
    lastRelaunchDate = today(); // mark today so we don't relaunch twice
    log.warn(`[Watchdog] Auto-relaunch triggered — ${reason}`);
    log.warn('[Watchdog] Stopping interval and relaunching now...');
    stopMemoryWatchdog();
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData();
    appRef.relaunch();
    appRef.exit(0);

};

// ---------------------------------------------------------------------------
// startMemoryWatchdog
// Call this once from main.js after app is ready.
// @param {Electron.App} appRef   — the Electron app object
// ---------------------------------------------------------------------------
export const startMemoryWatchdog = (appRef) => {
    log.info(
        `[Watchdog] Started`,
        `| Daily relaunch: ${WATCHDOG.relaunchHour}:${String(WATCHDOG.relaunchMinute).padStart(2, '0')}`,
        `| Memory limit: ${WATCHDOG.maxMemoryMB} MB`,
        `| Idle threshold: ${WATCHDOG.idleMinutes} min`,
        `| Check every: ${WATCHDOG.checkIntervalMs / 1000} s`,
    );

    checkInterval = setInterval(() => {
        const memMB = getMemoryMB();
        const idleSec = powerMonitor.getSystemIdleTime();

        log.info(
            `[Watchdog] Memory: ${memMB} MB`,
            `| System idle: ${Math.round(idleSec / 60)} min`,
        );

        const idle = isSystemIdle();

        // --- Trigger 1: Scheduled nightly relaunch ---------------------------
        // Fires once per day at relaunchHour:relaunchMinute (default 3 AM) if user is idle
        if (isScheduledTime() && idle) {
            doRelaunch(`scheduled daily relaunch at ${WATCHDOG.relaunchHour}:${String(WATCHDOG.relaunchMinute).padStart(2, '0')}`, appRef);
            return;
        }

        // --- Trigger 2: Memory over limit ------------------------------------
        // Only fires if user is idle — never interrupts an active session
        if (memMB > WATCHDOG.maxMemoryMB && idle) {
            doRelaunch(`memory limit exceeded (${memMB} MB > ${WATCHDOG.maxMemoryMB} MB)`, appRef);
        }
    }, WATCHDOG.checkIntervalMs);
};

// ---------------------------------------------------------------------------
// stopMemoryWatchdog
// Called automatically on relaunch; also call from app before-quit.
// ---------------------------------------------------------------------------
export const stopMemoryWatchdog = () => {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        log.info('[Watchdog] Stopped');
    }
};
