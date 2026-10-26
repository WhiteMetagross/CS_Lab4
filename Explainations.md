# Comprehensive Technical Explanations of Four Web Server Vulnerabilities and Multi Layered Defenses:

## 1. Executive Summary and Architecture:
1. This technical document provides an exhaustive architectural and theoretical breakdown of the four web server security vulnerabilities investigated in Cyber Security laboratory coursework.
2. The four vulnerability categories analyzed are SQL Injection, OS Command Injection, Cross Site Scripting, and Cross Site Request Forgery.
3. The accompanying codebase contains two complete standalone editions: Version 1 demonstrating vulnerable implementations, and Version 2 demonstrating multi layered defenses.
4. Each vulnerability is analyzed through its root cause, vulnerable code path in Version 1, working exploit payload, multi layered remediation implemented in Version 2, and theoretical alternative mitigations discussed in course lectures.

## 2. Directory Structure and Component Breakdown:

### 2.1 Directory `IIITAOSCommunityForumV1`:
1. Purpose: Contains the intentionally vulnerable edition running on local port 3000.
2. Server Architecture: Built using Express and native SQLite DatabaseSync.
3. Route Files: `auth.js` for authentication and profile management, `posts.js` for discussion topics and search, `chat.js` for live messaging, and `diagnostics.js` for server node connectivity testing.
4. Client Architecture: Single page application built in React 19 rendering components for discussions, chat, member profiles, and server diagnostics.
5. Insecure Implementation Paths: String concatenated SQL queries, unvalidated command execution via `child_process.exec`, raw HTML rendering via `innerHTML`, and ambient cookie state modifications without anti CSRF tokens.

### 2.2 Directory `IIITAOSCommunityForumV2`:
1. Purpose: Contains the hardened defended edition running on local port 5000.
2. Server Architecture: Express server configured with HTTP Content Security Policy headers, strict CORS domain policies, and request verification pipelines.
3. Multi Layered Defensive Middleware: Implements Anti CSRF synchronizer token verification, Origin and Referer header checking, and input allow list validation.
4. Secure Execution Models: Parameterized SQLite prepared statements, `child_process.execFile` execution using argument vectors without a shell, and DOMPurify rich HTML sanitization.

## 3. Comprehensive Breakdown of SQL Injection:

### 3.1 Technical Definition and Root Cause:
1. Definition: SQL Injection is a vulnerability that occurs when untrusted user input is directly concatenated into a dynamic SQL query string instead of being handled as isolated data.
2. Root Cause: The SQL database parser cannot distinguish between user provided data and developer provided command syntax when input contains SQL metacharacters like quotation marks, comment markers, or boolean operators.
3. Threat Impact: Attackers can bypass authentication to impersonate administrators, extract confidential records from arbitrary tables via UNION operators, modify database records, or corrupt backend data.

### 3.2 Vulnerable Code Paths in Version 1:
1. Flaw in Authentication Login: In file `IIITAOSCommunityForumV1/server/routes/auth.js`, the `POST /api/auth/login` endpoint concatenates raw username and password strings.
```javascript
const rawQuery = "SELECT id, username, password, full_name, role, bio FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
const user = db.prepare(rawQuery).get();
```
2. Flaw in Discussion Topic Search: In file `IIITAOSCommunityForumV1/server/routes/posts.js`, the `GET /api/posts/search` endpoint concatenates the query parameter `q`.
```javascript
const rawQuery = "SELECT id, title, category, content FROM posts WHERE title LIKE '%" + q + "%' OR content LIKE '%" + q + "%'";
const posts = db.prepare(rawQuery).all();
```

### 3.3 Working Exploitation Walkthrough:
1. Variant 1 Authentication Bypass: In Version 1 on port 3000, navigate to Account Login and submit username `mridankan' --` with any password.
2. Query Result: The single quote closes the username string literal and the double dash comments out the password clause. The query executes as `SELECT ... WHERE username = 'mridankan'`, returning the administrator record and establishing an authenticated session.
3. Variant 2 UNION Based Data Extraction: In Version 1, enter `' UNION SELECT id, username, password, bio FROM users --` into the discussion search field.
4. Query Result: The database executes the UNION operator, appending all rows from the `users` table into the returned discussion list, exposing plaintext passwords and usernames.

### 3.4 Multi Layered Defenses Implemented in Version 2:
1. Defense 1 Parameterized Prepared Statements: In `IIITAOSCommunityForumV2/server/routes/auth.js` and `posts.js`, queries use prepared statements with parameter markers.
```javascript
const user = db.prepare('SELECT id, username, password, full_name, role, bio FROM users WHERE username = ?').get(username.trim().toLowerCase());
```
2. Defense 1 Explanation: Parameterized queries separate query compilation from data binding. The database engine pre compiles the SQL statement structure so user input is treated strictly as literal data values and cannot modify the command grammar.
3. Defense 2 Input Validation Allow Lists: Usernames and search terms are checked against regular expression allow lists before reaching database layers.
```javascript
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
if (!usernamePattern.test(username.trim())) {
  return res.status(400).json({ error: 'Invalid username format. Disallowed characters detected.' });
}
```
4. Defense 3 Safe Generic Error Handling: Database exceptions return standardized messages such as `Invalid username or password.` without disclosing SQL syntax errors or schema names.

### 3.5 Theoretical Mitigation Alternatives from Lecture Material:
1. Least Privilege Database Accounts: Running database operations under specialized accounts that only possess necessary permissions (such as SELECT and INSERT on specific tables) prevents attackers from accessing sensitive system tables or modifying schema even if injection occurs.
2. Stored Procedures: Precompiled database procedures that abstract database access can enforce strict parameter typing and restrict direct table access.
3. Database Abstraction Object Relational Mappers: Utilizing mature ORM tools that enforce parameterization natively across all query generation pipelines.

## 4. Comprehensive Breakdown of OS Command Injection:

### 4.1 Technical Definition and Root Cause:
1. Definition: OS Command Injection occurs when an application executes operating system level commands where user supplied input is passed directly to a system shell interpreter without parameterization or sanitization.
2. Root Cause: System shell interpreters like `sh`, `bash`, and `cmd.exe` process special metacharacters such as ampersands, semicolons, and pipes as command separators. If user input contains these characters, the shell executes arbitrary secondary commands with application privileges.
3. Threat Impact: Attackers can achieve remote code execution, view internal server files, install persistence tools, or pivot deeper into internal network subnets.

### 4.2 Vulnerable Code Paths in Version 1:
1. Flaw in Diagnostic Node Ping: In file `IIITAOSCommunityForumV1/server/routes/diagnostics.js`, the `POST /api/diagnostics/ping` endpoint uses `child_process.exec`.
```javascript
const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;
exec(command, (error, stdout, stderr) => { return res.json({ output: stdout || stderr }); });
```
2. Flaw in Background Archiver Task: The `POST /api/diagnostics/archive` endpoint concatenates input into a background task command executed via shell.
```javascript
const command = 'echo archiver ' + target;
exec(command, () => { res.json({ status: 'Diagnostics archive task scheduled successfully.' }); });
```

### 4.3 Working Exploitation Walkthrough:
1. Variant 1 In Band Command Injection: In Version 1 on port 3000 under the Diagnostics tab, submit `127.0.0.1 & whoami` in the Campus Server Diagnostics input.
2. Execution Result: The command shell interprets the ampersand as a command separator. It executes the ping followed immediately by `whoami`, returning the active server user account in the JSON response output.
3. Variant 2 Blind Time Based Command Injection: In Version 1, submit `telemetry & ping -n 6 127.0.0.1` in the Background Archiver input.
4. Execution Result: The server does not return terminal output, but the injected command forces a delay of over five seconds before returning the HTTP response, proving blind arbitrary execution.

### 4.4 Multi Layered Defenses Implemented in Version 2:
1. Defense 1 Avoiding the Shell via `execFile` with Argument Vectors: In file `IIITAOSCommunityForumV2/server/routes/diagnostics.js`, execution uses `child_process.execFile` with `shell: false`.
```javascript
const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];
execFile('ping', pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => { ... });
```
2. Defense 1 Explanation: By executing the binary executable directly without invoking a command shell, metacharacters such as `&`, `|`, and `;` lose their syntactic interpretation and are treated as literal text arguments, preventing command chaining.
3. Defense 2 Destination Host Regular Expression Allow List: Destination hosts are verified against a strict regex allow list permitting only valid domain names or IP addresses.
```javascript
const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;
if (!host || !hostPattern.test(host)) {
  return res.status(400).json({ error: 'Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators.' });
}
```
4. Defense 3 Static Whitelist Mapping for Background Tasks: Background diagnostics targets must match an approved static array of identifiers.

### 4.5 Theoretical Mitigation Alternatives from Lecture Material:
1. Native API Utilization: Whenever possible, avoid invoking system binaries entirely by using native language runtime APIs (such as Node.js native `net` or `dns` modules) to perform networking and operational tasks.
2. Sandboxing and Container Isolation: Running application processes inside non root containers with read only filesystems limits the damage an attacker can inflict if command execution occurs.
3. Principle of Least Privilege: Running worker processes under dedicated low privilege system accounts lacking administrative or command execution rights.

## 5. Comprehensive Breakdown of Cross Site Scripting (XSS):

### 5.1 Technical Definition and Root Cause:
1. Technical Definition: Cross Site Scripting occurs when an application includes untrusted user supplied data in a web page delivered to other users without adequate contextual output encoding or sanitization.
2. Root Cause: Web browsers parse HTML, CSS, and JavaScript within a single document stream. When untrusted input containing markup tags like `<script>` or `<img onerror=...>` is rendered into the DOM, the browser interprets it as executable code rather than plain text.
3. Threat Impact: Attackers can steal session cookies, hijack user accounts, log keystrokes, alter webpage appearance, or redirect victims to credential harvesting sites.

### 5.2 Vulnerable Code Paths in Version 1:
1. Flaw in Content Rendering Component: In file `IIITAOSCommunityForumV1/client/src/components/ContentRenderer.jsx`, user content is written directly into `innerHTML` and scripts are actively evaluated.
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
2. Flaw in Search Query Reflection: In file `IIITAOSCommunityForumV1/client/src/components/ForumView.jsx`, search queries are reflected directly into unescaped DOM elements using `ContentRenderer`.

### 5.3 Working Exploitation Walkthrough:
1. Variant 1 Stored XSS (Interactive DOM and Session Takeover): In Version 1 on port 3000, navigate to Discussions and open Post 4 `Security Showcase: Interactive DOM Manipulation and Session Audit`, or submit an interactive DOM takeover payload via Start Discussion.
2. Execution Result: The payload establishes unhindered script execution in the victim browser context. It extracts ambient session state and cookies into an injected control panel, manipulates the top navigation bar header by appending an animated `DOM HIJACKED BY XSS` badge, and exposes interactive controls that invert site themes and spawn custom notification toasts.
3. Delivery Vector for Reflected XSS via Phishing: Because reflected XSS attacks in production environments rely on social engineering, email phishing, or disguised advertisements, we implemented a dedicated disguised ad in the forum discussion feed: `Career Sponsor: Search 2026 Student Engineering Stipends`.
4. Variant 2 Reflected XSS Execution: Clicking `Search Stipends (Phishing Ad) ->` or opening our simulated external phishing portal at `http://localhost:3000/attackerPhishingAd.html` delivers a crafted URL with the payload inside the `search` query parameter.
5. Execution Result: In Version 1, `ForumView.jsx` reads the query parameter and reflects it unescaped via `ContentRenderer` into `innerHTML`. The script executes instantly and inserts the red `Reflected XSS Executed` alert box into the user interface.

### 5.4 Multi Layered Defenses Implemented in Version 2:
1. Defense 1 Rich HTML Sanitization via DOMPurify: In file `IIITAOSCommunityForumV2/client/src/components/ContentRenderer.jsx`, all content is sanitized with DOMPurify using strict allowed tag and attribute policies.
```javascript
const cleanHtml = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['class', 'style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'src']
});
containerRef.current.innerHTML = cleanHtml;
```
2. Defense 2 Framework Auto Escaping: Reflected search terms and metadata in `ForumView.jsx` are rendered strictly as React JSX text expressions `{activeSearch}` which auto escape characters like `<`, `>`, and `&`.
3. Defense 3 Content Security Policy (CSP): In `server/server.js`, the server delivers a strict CSP header:
```javascript
res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';");
```
4. Defense 4 HttpOnly Session Cookies: In `server/routes/auth.js`, session cookies are marked `httpOnly: true`, preventing client side JavaScript from reading session cookies.

### 5.5 Theoretical Mitigation Alternatives from Lecture Material:
1. Context Aware Output Encoding: Applying encoding specific to the destination context (such as HTML body encoding, HTML attribute encoding, JavaScript variable encoding, or URL parameter encoding) to ensure characters cannot break out of data delimiters.
2. Trusted Types API: Using browser level Trusted Types to ensure only pre approved and sanitized strings can be passed to dangerous DOM injection sinks like `innerHTML` and `eval`.
3. Subresource Integrity (SRI): Enforcing cryptographic hash validation on third party scripts to guarantee third party code has not been tampered with.

## 6. Comprehensive Breakdown of Cross Site Request Forgery (CSRF):

### 6.1 Technical Definition and Root Cause:
1. Definition: Cross Site Request Forgery is an attack where an external malicious web application coerces an authenticated user browser into sending unauthorized state changing requests to a vulnerable target application.
2. Root Cause: Web browsers automatically attach all stored ambient credentials (such as cookies) to outgoing requests directed to the target domain, regardless of whether the request originated from the target application or an external site.
3. Threat Impact: Attackers can forge requests modifying user profile data, altering email addresses, publishing spam, or executing administrative deletions without the victim knowledge.

### 6.2 Vulnerable Code Paths in Version 1:
1. Flaw in Profile Modification: In `IIITAOSCommunityForumV1/server/routes/auth.js`, endpoints accept POST and PUT requests relying solely on `session_token` without anti CSRF token verification.
2. Flaw in Cookie Issuance: Session cookies lack `SameSite: strict` directives.
```javascript
res.cookie('session_token', token, { path: '/' });
```
3. Flaw in Discussion Deletion via GET: In `IIITAOSCommunityForumV1/server/routes/posts.js`, the endpoint `GET /api/posts/delete-by-get` performs state modifications on HTTP GET requests.

### 6.3 Working Exploitation Walkthrough:
1. Delivery Vector via In-App Disguised Ads: To simulate realistic exploitation, sponsored campus partner advertisements for `CloudSphere Student Partner Credits` are embedded in the forum sidebar and discussion feed. Logged-in users navigating discussions can accidentally click on the promotional ad card or call-to-action button.
2. Variant 1 POST Based Forged Action via Disguised Ad: Clicking the ad opens `attackerCsrfExploit.html` styled as a legitimate student credit activation portal. In the background, the page automatically submits an unauthorized POST request to `/api/auth/profile` using ambient session cookies, instantly modifying the administrator profile biography.
3. Variant 2 GET Based Forged Action via Voucher Link: The attacker provides a secondary promotional link to `attackerCsrfGetExploit.html`. When clicked, an embedded request issues a GET query to `/api/posts/delete-by-get?id=3` with ambient cookies, deleting the discussion without victim consent.

### 6.4 Multi Layered Defenses Implemented in Version 2:
1. Defense 1 Cryptographic Anti CSRF Synchronizer Tokens: Upon login, a 256 bit random token is generated using `crypto.randomBytes(32)` and stored in the session.
2. Verification Middleware: The `verifyCsrf` middleware validates that state changing requests contain matching tokens inside the `X-CSRF-Token` header.
3. Defense 2 Strict SameSite Cookies: Cookies are issued with `sameSite: 'strict'` and `httpOnly: true`.
```javascript
res.cookie('session_token', token, {
  httpOnly: true,
  sameSite: 'strict',
  path: '/'
});
```
4. Defense 3 Origin and Referer Header Verification: Middleware verifies that incoming request `Origin` and `Referer` headers match the trusted application domain (`http://localhost:5000`).
5. Defense 4 Rejection of State Changing GET Requests: The endpoint `GET /api/posts/delete-by-get` returns HTTP 405 Method Not Allowed, enforcing that all state modifications use POST, PUT, or DELETE.

### 6.5 Theoretical Mitigation Alternatives from Lecture Material:
1. Re Authentication for Sensitive Operations: Requiring users to re enter their password or supply a one time passcode before executing high privilege operations like password changes or profile deletions.
2. Double Submit Cookie Pattern: Issuing a random token in a cookie and requiring frontend code to echo the identical token inside a custom request header, verified without server side session state.
3. Interaction Confirmation Dialogs: Enforcing user interaction challenges (such as CAPTCHA) that external auto submitting forms cannot solve.

## 7. Comparative Security Posture Matrix:
1. SQL Injection Authentication: Version 1 is vulnerable to quote breakout and comment termination. Version 2 is defended with parameterized prepared statements, allow list validation, and safe error messages.
2. SQL Injection Search: Version 1 is vulnerable to UNION based data extraction. Version 2 is defended with parameterized wildcard queries and character allow lists.
3. OS Command Injection In Band: Version 1 is vulnerable to shell metacharacters and output leakage. Version 2 is defended by avoiding the shell using `execFile` argument vectors and IPv4 hostname regex validation.
4. OS Command Injection Blind: Version 1 is vulnerable to time delay injection via ampersands. Version 2 is defended by strict target mapping and parameter separation.
5. Cross Site Scripting Stored: Version 1 is vulnerable to raw HTML rendering and script tag execution. Version 2 is defended with DOMPurify sanitization, Content Security Policy headers, and HttpOnly cookies.
6. Cross Site Scripting Reflected: Version 1 is vulnerable to unencoded search query reflection. Version 2 is defended by React JSX framework auto escaping and safe DOM sinks.
7. Cross Site Request Forgery GET: Version 1 is vulnerable to ambient cookie state modifications on image tags. Version 2 is defended by rejecting state changing GET requests with HTTP 405.
8. Cross Site Request Forgery POST: Version 1 is vulnerable to hidden form auto submission. Version 2 is defended by Anti CSRF synchronizer tokens, `SameSite: strict` cookies, and Origin validation.
