#!/usr/bin/env node
/**
 * Tiny static-site build script — no dependencies required.
 *
 * What it does:
 *  1. Reads the shared partials (partials/header.html, footer.html, drawer.html)
 *  2. Reads each page template in pages/*.html
 *  3. Replaces {{HEADER}}, {{FOOTER}}, {{DRAWER}} with the shared partial content
 *  4. Writes the finished, standalone HTML files to dist/
 *  5. Copies css/, js/, images/, data/, admin/ into dist/ too, so dist/ is
 *     fully self-contained and ready to upload or preview
 *
 * Usage:
 *   node build.js
 *
 * Why this exists:
 * Editing header.html/footer.html/drawer.html once updates every page —
 * you never edit the nav or footer three separate times again. This is
 * the plain-HTML equivalent of WordPress's get_header()/get_footer().
 *
 * *** IMPORTANT — read this before re-deploying ***
 * data/posts.json gets EDITED LIVE on the server by admin/index.php
 * whenever the client adds/edits/deletes a "This Week" post. That live
 * file is the real, current content — this project's local copy of
 * data/posts.json is only a starter/template.
 *
 * This means: after the FIRST deployment, do NOT re-upload data/posts.json
 * (or the whole data/ folder) when pushing routine site updates — doing so
 * will silently overwrite and delete everything the client has added
 * through the admin panel. Only re-upload the specific pages/css/js/images
 * you actually changed. See README.md for the full deployment checklist.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');
const PAGES_DIR = path.join(ROOT, 'pages');
const DIST_DIR = path.join(ROOT, 'dist');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  // 1. Load shared partials
  const header = read(path.join(PARTIALS_DIR, 'header.html'));
  const footer = read(path.join(PARTIALS_DIR, 'footer.html'));
  const drawer = read(path.join(PARTIALS_DIR, 'drawer.html'));

  // 2. Make sure dist/ exists and is clean
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 3. Build every page
  const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html'));
  for (const file of pageFiles) {
    let html = read(path.join(PAGES_DIR, file));
    html = html
      .replace('{{HEADER}}', header)
      .replace('{{FOOTER}}', footer)
      .replace('{{DRAWER}}', drawer);
    fs.writeFileSync(path.join(DIST_DIR, file), html);
    console.log('built:', file);
  }

  // 4. Copy static assets so dist/ is fully self-contained
  copyDir(path.join(ROOT, 'css'), path.join(DIST_DIR, 'css'));
  copyDir(path.join(ROOT, 'js'), path.join(DIST_DIR, 'js'));
  copyDir(path.join(ROOT, 'images'), path.join(DIST_DIR, 'images'));
  copyDir(path.join(ROOT, 'data'), path.join(DIST_DIR, 'data'));
  copyDir(path.join(ROOT, 'admin'), path.join(DIST_DIR, 'admin'));
  fs.copyFileSync(path.join(ROOT, 'posts-feed.php'), path.join(DIST_DIR, 'posts-feed.php'));

  console.log('\n⚠️  data/posts.json is LIVE-EDITED on the server via admin/index.php.');
  console.log('   admin/config.php holds the LIVE admin password once changed on the server.');
  console.log('   images/news/ fills up with LIVE-UPLOADED post images over time.');
  console.log('   After first deploy, do NOT re-upload data/, admin/config.php, or');
  console.log('   images/news/ carelessly — see README.md.');

  console.log('\nDone. Open dist/index.html in a browser, or run a local server:');
  console.log('  npx serve dist');
  console.log('  (or) python3 -m http.server --directory dist 8000');
}

build();
