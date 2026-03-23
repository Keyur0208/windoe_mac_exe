import log from 'electron-log';
import os from 'os';
import getMAC from 'getmac';

// ---------------------------------------------------------------------------
//  IP Address
//----------------------------------------------------------------------------
export function getIPAddress() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'Unknown';
}

// --------------------------------------------------------------------------
// Mac Address
// --------------------------------------------------------------------------

export function getMacAddress() {
    try {
        return getMAC();
    } catch (error) {
        log.error('Failed to get MAC address:', error.message);
        return 'Unknown';
    }
}

// ---------------------------------------------------------------------------
//  Computer Details
// ---------------------------------------------------------------------------
export function getComputerDetails() {
    const cpus = os.cpus();
    const totalRamMB = Math.round(os.totalmem() / (1024 * 1024));

    return {
        pcName: os.hostname(),
        username: os.userInfo().username,
        ipAddress: getIPAddress(),
        macAddress: getMacAddress(),
        platform: process.platform,
        arch: process.arch,
        cpuModel: cpus[0]?.model ?? 'Unknown',
        cpuCores: cpus.length,
        totalRamMB,
    };
}
