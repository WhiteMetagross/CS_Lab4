const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { authenticate, verifyCsrf } = require('./auth');

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

//Defense: Parameterized queries, input allow list validation, and safe error handling against UNION based SQL injection.
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();

  //Defense: Input validation allow list.
  const searchPattern = /^[a-zA-Z0-9\s.,?!_]{0,50}$/;
  if (!searchPattern.test(q)) {
    return res.status(400).json({ error: 'Search query contains disallowed characters. Only alphanumeric input is allowed.' });
  }

  const db = getDB();
  //Defense: Parameterized prepared statement preventing SQL injection and UNION data extraction.
  const query = 'SELECT id, title, category, content FROM posts WHERE title LIKE ? OR content LIKE ?';
  const wildcard = '%' + q + '%';

  try {
    const posts = db.prepare(query).all(wildcard, wildcard);
    return res.json({ query: q, posts });
  } catch (err) {
    return res.status(500).json({ error: 'Search operation failed safely.' });
  }
});

//Defense: Rejection of state changing operations via HTTP GET to prevent GET based CSRF.
router.get('/delete-by-get', (req, res) => {
  return res.status(405).json({
    error: 'CSRF Defense: State changing operations are strictly forbidden on HTTP GET requests. Use DELETE with anti CSRF token.'
  });
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

router.post('/', authenticate, verifyCsrf, (req, res) => {
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

router.post('/:id/comments', authenticate, verifyCsrf, (req, res) => {
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

router.delete('/:id', authenticate, verifyCsrf, (req, res) => {
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
