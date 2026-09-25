// ============================================================
// St Albans URC — "This Week" (local JSON, no WordPress)
//
// Content lives in data/posts.json, edited through admin/index.php.
// No external service, no API, no CORS concerns — just a JSON file
// this same site reads directly.
// ============================================================

// Fetches from posts-feed.php (server-side filtered), NOT data/posts.json
// directly — that raw file is blocked from public access (see
// data/.htaccess) since it can contain draft/scheduled content not meant
// to be public yet. posts-feed.php only ever returns what's actually
// meant to be visible right now.
const POSTS_FEED_PATH = 'posts-feed.php';

// Title/excerpt are plain text entered by the admin — escape before
// inserting into innerHTML so stray < > & " characters can't break the
// page layout. (post.content is intentionally left unescaped, since
// that field is meant to support basic HTML like <p> tags.)
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function fetchPosts() {
  const res = await fetch(POSTS_FEED_PATH, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Could not load posts-feed.php (' + res.status + ')');
  }
  return res.json();
}

// Rotating palette matching the rest of the site's brand colors — used
// as the background behind each post row when it has no image.
const ROW_COLORS = ['#1E3B32', '#1F4A52', '#6B2F3A', '#8A6A1E', '#2C4F6B', '#8C4A2F', '#4E3B63', '#3F5E3A'];

// ---------- "This Week" listing page ----------

async function renderPostList() {
  const container = document.getElementById('blogPosts');
  if (!container) return;

  container.innerHTML = '<p class="blog-state">Loading posts&hellip;</p>';

  try {
    const posts = await fetchPosts();

    if (!posts.length) {
      container.innerHTML = '<p class="blog-state">No posts published yet — check back soon.</p>';
      return;
    }

    container.innerHTML = '';
    container.className = 'blog-list';

    posts.forEach((post, i) => {
      const color = ROW_COLORS[i % ROW_COLORS.length];
      const imageUrl = post.image ? `images/news/${post.image}` : null;
      const visualStyle = imageUrl ? `background-image:url('${imageUrl}');` : `background-color:${color};`;

      const row = document.createElement('a');
      row.className = 'blog-row';
      row.href = `blog-post.html?id=${post.id}`;

      row.innerHTML = `
        <div class="blog-row-visual" style="${visualStyle}"></div>
        <div class="blog-row-body">
          <div class="blog-row-text">
            <h3>${escapeHtml(post.title)}</h3>
            <div class="blog-row-excerpt"><p>${escapeHtml(post.excerpt)}</p></div>
          </div>
          <span class="blog-row-cta">More Details</span>
        </div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <p class="blog-state error">
        Couldn't load posts right now. Check that <code>posts-feed.php</code> is reachable
        and is reachable, and that it's valid JSON (see README.md).
      </p>`;
  }
}

// ---------- Single post page ----------

async function renderSinglePost() {
  const container = document.getElementById('blogPost');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);

  if (!id) {
    container.innerHTML = '<p class="blog-state error">No post specified.</p>';
    return;
  }

  container.innerHTML = '<p class="blog-state">Loading post&hellip;</p>';

  try {
    const posts = await fetchPosts();
    const post = posts.find((p) => p.id === id);

    if (!post) {
      container.innerHTML = '<p class="blog-state error">Post not found.</p>';
      return;
    }

    const imageUrl = post.image ? `images/news/${post.image}` : null;
    document.title = post.title + ' — St Albans URC This Week';

    container.innerHTML = `
      <a class="blog-back" href="blog.html">&larr; Back to This Week</a>
      <h1>${escapeHtml(post.title)}</h1>
      ${imageUrl ? `<img class="blog-post-image" src="${imageUrl}" alt="${escapeHtml(post.title)}">` : ''}
      <div class="blog-post-content">${post.content}</div>
      <p style="margin-top:40px;"><a class="blog-back" href="blog.html">&larr; Back to This Week</a></p>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <p class="blog-state error">
        Couldn't load this post right now. Check that <code>posts-feed.php</code> is reachable
        and is reachable, and that it's valid JSON (see README.md).
      </p>`;
  }
}

// ---------- Auto-run on the right page ----------

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('blogPosts')) {
    renderPostList();
  }
  if (document.getElementById('blogPost')) {
    renderSinglePost();
  }
});
