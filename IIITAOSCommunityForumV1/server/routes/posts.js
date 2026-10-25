const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { authenticate } = require('./auth');

router.get('/', (req, res) => {
  const db = getDB();
  const posts = db.prepare(`
    SELECT 
      p.id, 
      p.user_id, 
      p.title, 
      p.category, 
      p.content, 
      p.created_at,
      u.username, 
      u.full_name, 
      u.role,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  return res.json({ posts });
});

//This does search posts using string concatenated SQL vulnerable to UNION based extraction and reflected XSS.
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const db = getDB();
  const rawQuery = "SELECT id, title, category, content FROM posts WHERE title LIKE '%" + q + "%' OR content LIKE '%" + q + "%'";

  try {
    const posts = db.prepare(rawQuery).all();
    return res.json({ query: q, posts });
  } catch (err) {
    return res.status(500).json({ error: 'Search query execution error: ' + err.message });
  }
});

//This does delete a post via GET request allowing GET based CSRF.
router.get('/delete-by-get', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const postId = req.query.id;
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required.' });
  }

  const db = getDB();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (req.user.role !== 'Administrator' && post.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

  return res.json({ message: 'Post deleted successfully via GET request.' });
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const post = db.prepare(`
    SELECT 
      p.id, 
      p.user_id, 
      p.title, 
      p.category, 
      p.content, 
      p.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const comments = db.prepare(`
    SELECT 
      c.id, 
      c.post_id, 
      c.user_id, 
      c.content, 
      c.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  return res.json({ post, comments });
});

router.post('/', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to create a post.' });
  }

  const { title, category, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Post title and content are required.' });
  }

  const db = getDB();
  const result = db.prepare(`
    INSERT INTO posts (user_id, title, category, content)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, title.trim(), category || 'General Discussion', content);

  const newPostId = Number(result.lastInsertRowid);
  const createdPost = db.prepare(`
    SELECT 
      p.id, 
      p.user_id, 
      p.title, 
      p.category, 
      p.content, 
      p.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(newPostId);

  return res.status(201).json({ message: 'Post created successfully', post: createdPost });
});

router.post('/:id/comments', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to comment.' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  const db = getDB();
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const result = db.prepare(`
    INSERT INTO comments (post_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, content);

  const newCommentId = Number(result.lastInsertRowid);
  const createdComment = db.prepare(`
    SELECT 
      c.id, 
      c.post_id, 
      c.user_id, 
      c.content, 
      c.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(newCommentId);

  return res.status(201).json({ message: 'Comment added', comment: createdComment });
});

router.delete('/:id', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const db = getDB();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (req.user.role !== 'Administrator' && post.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have permission to delete this post.' });
  }

  db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id);
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);

  return res.json({ message: 'Post deleted successfully' });
});

module.exports = router;
