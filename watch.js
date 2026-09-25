#!/usr/bin/env node
/**
 * Watches partials/, pages/, css/, js/, and images/ for changes and
 * re-runs build.js automatically. Pairs with a live-reloading static
 * server (see README / npm script "dev") so the browser refreshes
 * itself whenever you save a file — a proper local test environment
 * with no manual "rebuild, refresh" steps.
 *
 * Usage:
 *   node watch.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const WATCH_DIRS = ['partials', 'pages', 'css', 'js', 'images'];

let building = false;
let pending = false;

function runBuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  try {
    console.log('\n🔄 Change detected — rebuilding...');
    execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error('Build failed:', err.message);
  } finally {
    building = false;
    if (pending) {
      pending = false;
      runBuild();
    }
  }
}

// Initial build so dist/ is up to date the moment you start watching
runBuild();

// Watch each source directory (debounced, since some editors fire
// multiple change events per save). We walk subdirectories manually
// and watch each one individually — Node's { recursive: true } option
// only works reliably on macOS/Windows, not Linux.
let debounceTimer = null;
function scheduleRebuild() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runBuild, 150);
}

function watchDirRecursively(dir) {
  try {
    fs.watch(dir, (eventType, filename) => {
      if (filename) scheduleRebuild();
    });
  } catch (err) {
    console.warn('Could not watch', dir, '-', err.message);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      watchDirRecursively(path.join(dir, entry.name));
    }
  }
}

for (const dir of WATCH_DIRS) {
  const fullPath = path.join(ROOT, dir);
  if (!fs.existsSync(fullPath)) continue;
  watchDirRecursively(fullPath);
  console.log('👀 Watching', dir + '/');
}

console.log('\nWatching for changes. Press Ctrl+C to stop.');
console.log('In another terminal, run: npm run serve   (or) npx live-server dist\n');
