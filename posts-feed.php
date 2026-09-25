<?php
/**
 * Public-facing "This Week" feed.
 *
 * Why this file exists: js/news.js used to fetch data/posts.json directly.
 * That's a problem now that posts can be drafts or scheduled for the
 * future — anyone could view data/posts.json raw (via browser dev tools,
 * or just guessing the URL) and see draft/unpublished content that isn't
 * meant to be public yet.
 *
 * This script reads posts.json on the SERVER, filters out anything not
 * meant to be visible yet, and only then returns it as JSON. The raw
 * data/posts.json file is blocked from direct public access entirely
 * (see data/.htaccess) — this script is now the only way to read it.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dataFile = __DIR__ . '/data/posts.json';

if (!file_exists($dataFile)) {
    echo '[]';
    exit;
}

$posts = json_decode(file_get_contents($dataFile), true);
if (!is_array($posts)) {
    echo '[]';
    exit;
}

$visible = array_values(array_filter($posts, function ($post) {
    if (($post['status'] ?? 'published') !== 'published') return false;
    $publishAt = $post['publish_at'] ?? '';
    if ($publishAt !== '' && strtotime($publishAt) > time()) return false;
    return true;
}));

// Drop admin-only fields before sending to the public — status/publish_at
// aren't sensitive, but there's no reason to expose internal bookkeeping.
$public = array_map(function ($post) {
    return [
        'id'         => $post['id'],
        'title'      => $post['title'],
        'excerpt'    => $post['excerpt'],
        'content'    => $post['content'],
        'image'      => $post['image'],
        'updated_at' => $post['updated_at'] ?? ($post['created_at'] ?? ''),
    ];
}, $visible);

echo json_encode($public, JSON_UNESCAPED_SLASHES);
