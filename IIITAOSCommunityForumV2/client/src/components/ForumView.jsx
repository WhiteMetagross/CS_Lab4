import React, { useState, useEffect } from 'react';
import ContentRenderer from './ContentRenderer';

export default function ForumView({ user, onOpenAuth }) {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Discussion');
  const [newContent, setNewContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const categories = ['All', 'Announcements', 'Guides', 'General Discussion', 'Bug Reports'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
      setActiveSearch('');
    } catch (err) {
      setError('Failed to fetch discussions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  //Defense: Parameterized server search and framework auto escaped rendering of query reflections.
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/posts/search?q=' + encodeURIComponent(searchQuery));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }
      setPosts(data.posts || []);
      setActiveSearch(searchQuery);
    } catch (err) {
      setError('Search error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetails = async (id) => {
    try {
      const res = await fetch('/api/posts/' + id);
      const data = await res.json();
      if (res.ok) {
        setSelectedPost(data.post);
        setComments(data.comments || []);
      }
    } catch (err) {
      setError('Failed to load discussion details: ' + err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewTitle('');
      setNewContent('');
      setIsCreatingPost(false);
      fetchPosts();
      if (data.post) {
        fetchPostDetails(data.post.id);
      }
    } catch (err) {
      setError('Could not publish discussion: ' + err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!commentText.trim() || !selectedPost) return;

    try {
      const res = await fetch('/api/posts/' + selectedPost.id + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCommentText('');
      fetchPostDetails(selectedPost.id);
      fetchPosts();
    } catch (err) {
      setError('Could not post comment: ' + err.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    try {
      const res = await fetch('/api/posts/' + id, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setSelectedPost(null);
      fetchPosts();
    } catch (err) {
      setError('Failed to delete post: ' + err.message);
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Announcements': return 'badge-announcements';
      case 'Guides': return 'badge-guides';
      case 'General Discussion': return 'badge-general-discussion';
      case 'Bug Reports': return 'badge-bug-reports';
      default: return 'badge-general-discussion';
    }
  };

  const getCategoryCardClass = (category) => {
    switch (category) {
      case 'Announcements': return 'cat-announcements';
      case 'Guides': return 'cat-guides';
      case 'General Discussion': return 'cat-general-discussion';
      case 'Bug Reports': return 'cat-bug-reports';
      default: return 'cat-general-discussion';
    }
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'Administrator') return 'badge-admin';
    if (role === 'Contributor') return 'badge-contributor';
    return 'badge-student';
  };

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div>
      {error && (
        <div className="notice-banner vulnerable" style={{ marginBottom: '16px' }}>
          {error}
          <button className="close-btn" style={{ float: 'right' }} onClick={() => setError('')}>×</button>
        </div>
      )}

      {selectedPost ? (
        <div className="card discussion-box">
          <div style={{ marginBottom: '16px' }}>
            <button className="btn btn-sm btn-outline-blue" onClick={() => { setSelectedPost(null); fetchPosts(); }}>
              ← Back to Discussions
            </button>
          </div>

          <div className="discussion-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge ${getCategoryBadgeClass(selectedPost.category)}`} style={{ marginBottom: '8px' }}>
                  {selectedPost.category}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '6px 0 10px 0', color: 'var(--text-heading)' }}>
                  {selectedPost.title}
                </h2>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Author: <strong style={{ color: 'var(--text-primary)' }}>{selectedPost.full_name}</strong> (@{selectedPost.username}) : Role: <span className={`badge ${getRoleBadgeClass(selectedPost.role)}`}>{selectedPost.role}</span> : Posted: {new Date(selectedPost.created_at).toLocaleString()}
                </div>
              </div>

              {user && (user.role === 'Administrator' || user.username === selectedPost.username) && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeletePost(selectedPost.id)}
                >
                  Delete Discussion
                </button>
              )}
            </div>
          </div>

          <div className="discussion-body">
            <ContentRenderer content={selectedPost.content} />
          </div>

          <div style={{ marginTop: '26px' }}>
            <h3 className="comments-section-title">
              Discussion Comments ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                No comments on this discussion yet. Be the first to share your thoughts.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-meta">
                    <strong style={{ color: 'var(--text-heading)' }}>{comment.full_name}</strong>
                    <span>(@{comment.username})</span>
                    <span>:</span>
                    <span className={`badge ${getRoleBadgeClass(comment.role)}`}>{comment.role}</span>
                    <span>:</span>
                    <span>{new Date(comment.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="comment-content">
                    <ContentRenderer content={comment.content} />
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: '22px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <h4 style={{ fontSize: '0.96rem', marginBottom: '10px', color: 'var(--text-heading)' }}>Add Your Response</h4>
              {user ? (
                <form onSubmit={handleAddComment}>
                  <div className="form-group">
                    <textarea
                      className="form-textarea"
                      placeholder="Write your comment or response..."
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Submit Response
                  </button>
                </form>
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Please <button className="btn btn-sm btn-outline-blue" onClick={() => onOpenAuth('login')}>Log In</button> to post comments.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="forum-layout">
          <aside>
            <div className="sidebar-categories">
              <div style={{ fontSize: '0.84rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Categories
              </div>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '18px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (!user) {
                    onOpenAuth('login');
                  } else {
                    setIsCreatingPost(true);
                  }
                }}
              >
                + Start Discussion
              </button>
            </div>

            {/* Defense: Embed campus partner ad and demonstrate immunity to CSRF attacks. */}
            <div
              className="sponsored-ad-card"
              onClick={() => window.open('/attackerCsrfExploit.html', '_blank')}
              title="Click to claim campus partner credits"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="sponsored-ad-badge">Campus Partner</span>
                <span style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: '700' }}>SPONSORED</span>
              </div>
              <h4 className="sponsored-ad-title">
                Claim 500 Free Cloud Compute Credits!
              </h4>
              <p className="sponsored-ad-desc">
                Exclusive developer grant for IIIT-A students. Deploy high performance instances instantly with zero credit card setup.
              </p>
              <a
                href="/attackerCsrfExploit.html"
                target="_blank"
                rel="noopener noreferrer"
                className="sponsored-ad-btn"
                onClick={(e) => e.stopPropagation()}
              >
                Claim Student Credits Now →
              </a>
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <a
                  href="/attackerCsrfGetExploit.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.72rem', color: '#b45309', textDecoration: 'underline' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Or claim free campus domain voucher
                </a>
              </div>
            </div>
          </aside>

          <main>
            <div className="card" style={{ marginBottom: '18px', padding: '16px' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Search discussions safely by topic or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Search
                </button>
                {activeSearch && (
                  <button
                    type="button"
                    className="btn btn-outline-blue btn-sm"
                    onClick={() => {
                      setSearchQuery('');
                      fetchPosts();
                    }}
                  >
                    Reset
                  </button>
                )}
              </form>

              {activeSearch && (
                <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#334155' }}>
                  Search results for: <strong style={{ color: '#0284c7' }}>{activeSearch}</strong>
                </div>
              )}
            </div>

            {/* Defense: Display sponsored announcement banner safely. */}
            <div
              className="sponsored-feed-banner"
              onClick={() => window.open('/attackerCsrfExploit.html', '_blank')}
              title="Campus Partner Promotion"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="sponsored-ad-badge">Promoted</span>
                    <strong style={{ fontSize: '0.9rem', color: '#78350f' }}>IIIT Allahabad Student Cloud Program</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
                    Free 500 Compute Credits for all registered students. One click instant grant activation.
                  </div>
                </div>
                <a
                  href="/attackerCsrfExploit.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsored-ad-btn"
                  style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Claim Credits →
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)' }}>
                {activeCategory} Discussions ({filteredPosts.length})
              </h2>
            </div>

            {loading ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading discussions...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                No discussions found matching this query or category.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`post-item ${getCategoryCardClass(post.category)}`}
                  onClick={() => fetchPostDetails(post.id)}
                >
                  <div className="post-meta">
                    <span className={`badge ${getCategoryBadgeClass(post.category)}`}>{post.category}</span>
                    <span>Posted by: <strong style={{ color: 'var(--text-primary)' }}>{post.full_name}</strong></span>
                    <span>:</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>

                  <h3 className="post-title">{post.title}</h3>

                  <div className="post-preview">
                    {post.content.replace(/<[^>]*>?/gm, '').substring(0, 140)}...
                  </div>

                  <div className="post-footer">
                    <span>Author: {post.full_name} ({post.role})</span>
                    <span className="post-footer-comments">{post.comment_count} comments →</span>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      )}

      {isCreatingPost && (
        <div className="modal-overlay" onClick={() => setIsCreatingPost(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="card-title">Start a New Discussion</h3>
              <button className="close-btn" onClick={() => setIsCreatingPost(false)}>×</button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label className="form-label">Discussion Title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Enter a descriptive discussion title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Announcements">Announcements</option>
                  <option value="Guides">Guides</option>
                  <option value="General Discussion">General Discussion</option>
                  <option value="Bug Reports">Bug Reports</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Discussion Content / Body</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '140px' }}
                  required
                  placeholder="Write the full discussion content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline-blue"
                  onClick={() => setIsCreatingPost(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
