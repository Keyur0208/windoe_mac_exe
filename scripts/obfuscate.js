import JavaScriptObfuscator from 'javascript-obfuscator';
import {
    existsSync, mkdirSync, rmSync,
    readdirSync, statSync,
    readFileSync, writeFileSync, copyFileSync,
} from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');   // project root
const OUT = join(ROOT, 'obfuscated'); // staging directory

// ---------------------------------------------------------------------------
// Obfuscator options
// ---------------------------------------------------------------------------
const OBF_OPTIONS = {
    target: 'node',
    compact: true,
    // --- OFF: these can break ESM / async-await / Electron internals ------
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    selfDefending: false,
    renameGlobals: false,   // MUST stay false for Electron/Node
    renameProperties: false,   // MUST stay false — breaks object access
    // --- ON: safe string obfuscation --------------------------------------
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.80,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
};

// ---------------------------------------------------------------------------
// Source entries to process  (relative to ROOT)
// JS files inside these are obfuscated; everything else is copied as-is.
// ---------------------------------------------------------------------------
const JS_SOURCES = [
    'main.js',
    'src',           // src/electron/, src/config/, src/utils/
];

// Files / dirs that are copied unchanged (assets, templates, config)
const COPY_SOURCES = [
    'public',
    'package.json',
    'logo.ico',
    'logo.icns',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ensureDir = (dir) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const relPath = (abs) => abs.replace(ROOT, '').replace(/\\/g, '/');

const obfuscateFile = (src, dest) => {
    const code = readFileSync(src, 'utf8');
    try {
        const result = JavaScriptObfuscator.obfuscate(code, OBF_OPTIONS);
        writeFileSync(dest, result.getObfuscatedCode(), 'utf8');
        console.log('  [obfuscated]', relPath(dest));
    } catch (err) {
        // Fallback: copy as plain source if obfuscation fails
        console.warn('  [WARN] Obfuscation failed — copying plain:', relPath(src), err.message);
        copyFileSync(src, dest);
    }
};

// Recursively walk src/  obfuscate .js, copy everything else
const processEntry = (rel) => {
    const src = join(ROOT, rel);
    const dest = join(OUT, rel);

    if (!existsSync(src)) return; // silently skip missing optional files

    if (statSync(src).isDirectory()) {
        ensureDir(dest);
        for (const child of readdirSync(src)) {
            processEntry(`${rel}/${child}`);
        }
    } else {
        ensureDir(dirname(dest));
        if (extname(src) === '.js') {
            obfuscateFile(src, dest);
        } else {
            copyFileSync(src, dest);
            console.log('  [copied]   ', relPath(dest));
        }
    }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('\n====================================================');
console.log(' Obfuscation — Nilkanth Medico ERP');
console.log('====================================================');

console.log('\n[1/3] Clearing output directory:', relPath(OUT));
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log('\n[2/3] Obfuscating JS source files...');
for (const entry of JS_SOURCES) processEntry(entry);

console.log('\n[3/3] Copying static / asset files...');
for (const entry of COPY_SOURCES) processEntry(entry);

console.log('\n====================================================');
console.log(' Done! Staging directory:', relPath(OUT));
console.log(' Next step: electron-builder --projectDir . --config electron-builder.prod.json');
console.log('====================================================\n');
