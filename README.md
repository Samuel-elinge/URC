# St Albans URC — site demo (single-source build)

A plain HTML/CSS/JS project — no framework, no npm dependencies — structured
so the header, footer, and visitor drawer each live in exactly **one file**,
instead of being duplicated across every page.

## Structure

```
urc-site/
├── partials/          ← edit these ONCE, every page updates
│   ├── header.html    (logo + nav)
│   ├── footer.html    (footer columns, social links, addresses)
│   └── drawer.html    (the "Plan your visit" slide-out panel)
│
├── pages/              ← page CONTENT only (no header/footer markup)
│   ├── index.html      (homepage: hero, welcome, coloured info blocks)
│   ├── services.html   (Morning/Evening/Special Services)
│   └── contact.html    (maps, addresses, contact form)
│
├── css/
│   └── style.css       ← every style rule, one file, no duplication
│
├── js/
│   ├── main.js          ← nav toggle, drawer open/close, active-link
│   │                        highlighting, contact form handler
│   └── news.js           ← reads posts-feed.php to render "This Week"
│
├── posts-feed.php        ← public-facing filtered JSON feed — the ONLY
│                             thing js/news.js talks to (see below)
│
├── data/
│   ├── posts.json         ← "This Week" content — LIVE-EDITED on the
│   │                          server via admin/. Direct public access
│   │                          is BLOCKED (.htaccess) — only PHP reads it
│   └── .htaccess
│
├── admin/
│   ├── index.php           ← the admin page (add/edit/delete posts,
│   │                           image upload, rich text editor)
│   ├── login.php            ← password login screen
│   ├── logout.php
│   ├── security.php         ← CSRF + rate-limiting + session helpers
│   ├── config.php            ← the admin password lives here
│   └── .htaccess              ← blocks direct access to config.php/security.php
│
├── images/              ← real image files (not base64 — much lighter,
│   │                      and browsers/CDNs can cache them properly)
│   └── news/              ← uploaded "This Week" post images land here
│
├── build.js             ← stitches partials into pages/ → dist/
└── dist/                 ← GENERATED. Never edit files in here directly —
                            they get wiped and rebuilt every time you run
                            `node build.js`. This is what you'd upload or
                            open in a browser.
```

## How to make a change

- **Want to edit the nav links, logo, or footer?** → edit the one file in
  `partials/`, then rebuild.
- **Want to edit page content, add a paragraph, swap a photo?** → edit the
  relevant file in `pages/`, then rebuild.
- **Want to change any styling (colours, fonts, spacing)?** → edit
  `css/style.css`, no rebuild needed (it's just linked, not stitched).
- **Want to change nav/drawer behaviour?** → edit `js/main.js`, no rebuild
  needed either.

The only time you MUST run the build again is after editing something in
`partials/` or `pages/`, since those get combined into `dist/`.

## Building

```bash
node build.js
```

No install step, no dependencies — just plain Node.

## Local test environment (auto-rebuild + auto-reload)

For active development, run these in two separate terminals:

**Terminal 1 — watches your files and rebuilds automatically:**
```bash
npm run watch
```
This runs an initial build, then rebuilds `dist/` every time you save a
change inside `partials/`, `pages/`, `css/`, `js/`, or `images/`.

**Terminal 2 — serves dist/ with live-reload in the browser:**
```bash
npm run serve
```
This uses `live-server` (fetched on-the-fly via `npx`, no install needed)
to serve `dist/` and automatically refresh your browser tab whenever a
file in `dist/` changes — which `npm run watch` is doing for you in the
other terminal.

Put them together: edit a file, save, and your browser tab updates within
about a second, with no manual rebuild or refresh needed.

If you'd rather not use two terminals, a single one-off build + plain
static server also works fine for a quick look:
```bash
node build.js
npx serve dist
```
— just without the auto-rebuild/auto-reload convenience.

## Previewing (one-off, no auto-reload)

```bash
node build.js
npx serve dist
```
or, without Node's `serve` package:
```bash
python3 -m http.server --directory dist 8000
```
Then open `http://localhost:8000` (or whatever port `serve` gives you).

## Why not just open dist/index.html directly?

You can, but the Google Maps embeds on the Contact page and a couple of
other things behave better served over `http://` than opened directly as
a `file://` path in some browsers — a local server avoids that entirely
and takes one extra command.

## This Week (local JSON — no WordPress)

The "This Week" page (what visitors see at `blog.html`) is powered by a
plain JSON file — `data/posts.json` — edited through a small admin page at
`admin/index.php`. No WordPress, no database, no external service.

### One-time setup

**1. Change the admin password.** Open `admin/config.php` and replace the
   placeholder password with your own:
   ```php
   define('ADMIN_PASSWORD', 'your-own-password-here');
   ```
   That's it — no hashing, no tools, just edit the string and save. Do this
   **before** going live, or immediately after — the file ships with a
   randomly generated placeholder so it's not left on something guessable,
   but it should still be your own password.

**2. (Recommended, extra layer) Also password-protect the /admin/ folder
   via cPanel.** The login screen above is enough on its own, but stacking
   cPanel's own directory password on top is genuinely stronger — it's
   an entirely separate check with zero code, before your browser even
   reaches the login page:
   - In cPanel, go to **Files → Directory Privacy** (sometimes called
     "Password Protect Directories")
   - Navigate to and select the `admin` folder inside your site's root
   - Tick "Password protect this directory", give it a name, save
   - Create a username and password for it (this can be different from
     the admin password in step 1 — two separate layers)

**3. Make sure PHP can write to data/posts.json.** Most cPanel hosting
   allows this by default. If saving a post ever fails, check the file
   permissions on `data/posts.json` (usually needs to be writable by the
   web server — 644 or 664 is typically fine on shared hosting; ask your
   host if in doubt).

**4. Upload `admin/` and `data/` once**, along with everything else, on
   first deployment.

### Day-to-day use (for the client)

1. Go to `yoursite.com/admin/` — you'll land on a login screen
2. Enter the admin password and click **Log in**
3. Fill in the form to add a new post:
   - **Title** and **Content** are required, everything else is optional
   - **Content** has a small formatting toolbar — select text and click
     Bold, Italic, Underline, or Link to format it, same idea as any
     basic word processor
   - **Image** — click the file field and choose a photo straight from
     your computer or phone, no separate upload step needed (JPG, PNG,
     GIF, or WEBP, up to 5MB)
   - **Status** — choose "Published" to make it live, or "Draft" to save
     it without showing it on the site yet
   - **Publish date/time** — leave blank to publish immediately, or pick
     a future date/time to have it appear automatically then, without
     needing to come back and do anything else
4. Click **Add Post** — published posts appear immediately on the live
   "This Week" page; drafts and scheduled posts won't show until you
   change their status or their scheduled time arrives
5. Each post in the list below shows a **Live / Scheduled / Draft** badge
   so you can see its status at a glance
6. To change or remove something later, click **Edit** or **Delete** next
   to any post in the list
7. Click **Log out** in the top-right when you're done — especially
   important on a shared/public computer (you'll also be logged out
   automatically after 30 minutes of inactivity)

### *** Critical — read this before re-deploying any site update ***

Three things under `admin/`/`data/`/`images/` get changed **live on the
server**, separately from anything in this project folder:

- **`data/posts.json`** — updated every time the client adds/edits/deletes
  a post. The copy in this project folder is only a starter template.
- **`admin/config.php`** — updated once the client changes their password
  from the placeholder to their own (step 1 above). The copy in this
  project folder still has whatever placeholder/test password was last
  set here, not the live one.
- **`images/news/`** — fills up with real uploaded post images over time.
  The copy in this project folder is empty.

**This means:** after the first deployment, when you push a routine site
update (e.g. you fixed a typo on the Contact page), do **NOT** re-upload
`data/posts.json`, `admin/config.php`, or wholesale-replace `images/news/`
— doing so will silently delete the client's posts, reset their password,
or delete their uploaded photos. Only re-upload the specific files you
actually changed (the affected page(s), and `css/`/`js/` if you touched
those). `admin/index.php`, `admin/login.php`, `admin/logout.php`,
`admin/security.php`, and `posts-feed.php` are all safe to re-upload any
time you improve them — just never those three items above.

`node build.js` will print a reminder of this every time you run it, since
it's easy to forget mid-deployment.

### Security

Several layers, each doing a specific job:

- **Login required**, with a password only you and the client know
  (`admin/config.php`)
- **Rate-limited login** — 5 wrong attempts triggers a lockout that grows
  each time (30s, 60s, 120s...), so the password can't be brute-forced by
  just guessing repeatedly
- **CSRF protection** on every form — a one-time token is checked on
  submit, so another website can't trick a logged-in admin's browser into
  submitting changes without them meaning to
- **Hardened session cookies** (HttpOnly so JavaScript can't read them,
  Secure on HTTPS, SameSite) plus auto-logout after 30 minutes idle, and
  the session ID itself rotates periodically while logged in
- **Strict image upload validation** — files are checked by their actual
  image content (not just their extension, which can be faked), capped at
  5MB, and always saved under a brand-new random filename — so there's no
  way to sneak in a disguised executable file or exploit the original
  filename
- **Drafts/scheduled posts are genuinely hidden from the public**, not
  just hidden in the page's display. `data/posts.json` (which can contain
  unpublished content) is blocked from direct access entirely via
  `data/.htaccess`. The public site only ever talks to `posts-feed.php`,
  which filters server-side and only returns what's actually meant to be
  visible right now
- **`config.php` and `security.php`** are blocked from direct browser
  access too (`admin/.htaccess`) — they're only meant to be loaded
  internally by the other admin scripts

(Optional extra layer, still recommended: stacking cPanel's own directory
password on top of `/admin/` via Files → Directory Privacy — genuinely
adds a second, independent check before your browser even reaches the
login page.)

### How it works, if you're curious

- `admin/login.php` checks a submitted password against `admin/config.php`
  using `hash_equals()` (a timing-safe string comparison), and on success
  sets a PHP session flag.
- `admin/index.php` checks that session flag at the very top of the file
  and redirects to the login page if it's not set — so nothing on the
  admin page is reachable without logging in first.
- `admin/index.php` reads and writes `../data/posts.json` directly using
  plain PHP file functions — no database.
- Image uploads are validated with `getimagesize()` (checks the file is
  genuinely image data, not just named like one) and saved under a random
  filename into `images/news/`.
- `posts-feed.php` (at the site root) is the only thing the public site
  actually talks to — it reads `data/posts.json` server-side, filters out
  drafts and anything scheduled for the future, strips out the internal
  `status`/`publish_at` fields, and returns just what should be public.
- `js/news.js` fetches `posts-feed.php` client-side and renders it into
  `blog.html` (the list) and `blog-post.html` (a single post, found via a
  `?id=` URL parameter).
- Post `content` fields are allowed to contain basic HTML (from the rich
  text toolbar) since that's how formatting/links get saved. Title and
  excerpt are treated as plain text and HTML-escaped when rendered, so
  stray characters in those fields can't break the page layout.

### Troubleshooting

If the "This Week" page shows "Couldn't load posts right now":
- Open the browser console (F12) and check for a fetch error on
  `data/posts.json` — a 404 usually means that file didn't get uploaded,
  or isn't at the expected path relative to the HTML pages
- Visit `data/posts.json` directly in a browser — it should show raw JSON
  text. If it 404s, the file's missing; if it looks broken, someone likely
  hand-edited it and introduced invalid JSON (a trailing comma is the most
  common cause) — the admin panel itself always produces valid JSON, so
  this is only a risk if someone edits the file directly instead of
  through the admin page

## Known placeholders / still-to-do

- Remaining "Our Church" dropdown items still pointing at `#`: Creation
  Care, Church Groups – Greenwood, Community Groups – Homewood. (Children
  and Families, Church Groups – Homewood, Community Groups – Greenwood,
  and Policies are all built and linked.)
- "Calendar" (inside the What's On dropdown, alongside the now-live Blog)
  still links to `#`.
- Several homepage info-block cards (Families & Children, Cosy Café, Choir,
  Greenwood Social, Strollers & Ramblers) link to `#` since their pages
  haven't been built yet — swap in real URLs in `pages/index.html` once
  they exist.
- The contact form on `contact.html` is front-end only right now (shows a
  success message, but doesn't actually send email) — `js/main.js` has a
  comment marking exactly where to wire up a real submission handler once
  there's a backend or a form service (e.g. Formspree, Netlify Forms) in
  place.
