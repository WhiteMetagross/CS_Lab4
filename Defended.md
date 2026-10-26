# Defended Application Security Manual:

## 1. Architectural Defense Strategy in Version 2:
1. Version 2 of the IIIT Allahabad Open Source Community Forum implements an industry standard multi layered defense in depth architecture.
2. The application runs on local port 5000 and eliminates every single vulnerability demonstrated in Version 1.
3. Security controls operate across multiple tiers including browser level policies, perimeter network validation, application middleware, and database parameterization layers.

## 2. Category 1: SQL Injection Multi Layered Defenses:

### 2.1 Defense Implementations:
1. Parameterized Prepared Statements: Located in `IIITAOSCommunityForumV2/server/routes/auth.js` and `posts.js`.
2. Implementation Code.
```javascript
const user = db.prepare('SELECT id, username, password, full_name, role, bio FROM users WHERE username = ?').get(username.trim().toLowerCase());
```
3. Mechanism: Pre compiled SQL statements ensure the database engine compiles the command structure prior to binding parameter data, completely preventing user input from breaking out of literal data boundaries.
4. Input Validation Allow Lists: All input parameters must strictly match regular expression allow lists before query execution.
```javascript
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
if (!usernamePattern.test(username.trim())) {
  return res.status(400).json({ error: 'Invalid username format. Disallowed characters detected.' });
}
```
5. Safe Error Responses: Any query anomalies return generic messages without exposing SQL error strings or table schemas.

### 2.2 Attack Neutralization Evidence:
1. Authentication Bypass Attempt: Submitting `mridankan' --` to `POST /api/auth/login` on port 5000 is immediately rejected with HTTP 400 Bad Request: `Invalid username format. Disallowed characters detected.`
2. UNION Extraction Attempt: Submitting `' UNION SELECT id, username, password, bio FROM users --` to `/api/posts/search` is rejected with HTTP 400: `Search query contains disallowed characters. Only alphanumeric input is allowed.`

## 3. Category 2: OS Command Injection Multi Layered Defenses:

### 3.1 Defense Implementations:
1. Avoiding the Shell via `child_process.execFile`: Located in `IIITAOSCommunityForumV2/server/routes/diagnostics.js`.
2. Implementation Code.
```javascript
const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];
execFile('ping', pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => { ... });
```
3. Mechanism: The `execFile` function executes system binaries directly without spawning an intermediate shell (`cmd.exe` or `/bin/sh`). Shell metacharacters such as `&`, `|`, and `;` are treated as literal arguments rather than command separators.
4. Strict Destination Host Regular Expression Allow List:
```javascript
const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;
if (!host || !hostPattern.test(host)) {
  return res.status(400).json({ error: 'Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators.' });
}
```
5. Background Archiver Target Allow List: Diagnostic tasks must match approved static identifiers.

### 3.2 Attack Neutralization Evidence:
1. In Band Injection Attempt: Submitting `127.0.0.1 & whoami` to `POST /api/diagnostics/ping` is rejected with HTTP 400 Bad Request, blocking shell execution.
2. Blind Time Based Attempt: Submitting `telemetry & ping -n 6 127.0.0.1` to `POST /api/diagnostics/archive` is rejected immediately because the target is not in the approved allow list.

## 4. Category 3: Cross Site Scripting (XSS) Multi Layered Defenses:

### 4.1 Defense Implementations:
1. DOMPurify Sanitization: Located in `IIITAOSCommunityForumV2/client/src/components/ContentRenderer.jsx`.
2. Implementation Code.
```javascript
const cleanHtml = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['class', 'style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'src']
});
containerRef.current.innerHTML = cleanHtml;
```
3. Mechanism: Neutralizes all executable script elements and strips event handler attributes before DOM insertion.
4. Framework Auto Escaping: Reflected search queries are rendered strictly through React JSX text expressions `{activeSearch}`.
5. Content Security Policy (CSP): In `server/server.js`, HTTP response headers restrict script execution to authorized origin scripts.
6. HttpOnly Session Cookies: In `server/routes/auth.js`, session cookies are marked `httpOnly: true`, preventing JavaScript from reading session cookies.

### 4.2 Attack Neutralization Evidence:
1. Stored XSS Attempt: Opening Post 4 `Security Showcase: Interactive DOM Manipulation and Session Audit` proves complete defense. DOMPurify strips the script tags, image error handlers, and dangerous attributes. The navigation bar title remains untouched, no theme inversion or toasts can be triggered, and `HttpOnly` cookies cannot be accessed.
2. Reflected XSS Attempt: Searching for `<img src="x" onerror="var t=document.createElement('div');t.style='margin:10px 0;padding:12px;background:#ef4444;color:#fff;border-radius:6px;font-weight:700;';t.innerText='Reflected XSS Execution: Search Parameter Executed Arbitrary JavaScript';this.parentNode.appendChild(t);" />` renders safely as escaped plain text inside a React JSX text node without any script execution.

## 5. Category 4: Cross Site Request Forgery (CSRF) Multi Layered Defenses:

### 5.1 Defense Implementations:
1. Cryptographic Anti CSRF Synchronizer Tokens: Located in `IIITAOSCommunityForumV2/server/routes/auth.js`.
2. Implementation Code.
```javascript
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const submittedToken = req.headers['x-csrf-token'] || req.body?.csrf_token || req.query?.csrf_token;
  const expectedToken = req.user?.csrfToken;
  if (!submittedToken || !expectedToken || submittedToken !== expectedToken) {
    return res.status(403).json({ error: 'CSRF Protection: Missing or invalid anti CSRF synchronizer token.' });
  }
  next();
}
```
3. Strict SameSite Cookies: Cookies are issued with `sameSite: 'strict'` and `httpOnly: true`.
4. Origin and Referer Header Verification: Requests from foreign origins are blocked with HTTP 403 Forbidden.
5. Rejection of State Changing GET Requests: The endpoint `GET /api/posts/delete-by-get` returns HTTP 405 Method Not Allowed.
6. Embedded Disguised Ad Neutralization: Even when a user accidentally clicks the promotional campus partner ad card on `http://localhost:5000`, the resulting cross-origin request sent by `attackerCsrfExploit.html` is rejected with HTTP 403 Forbidden.

### 5.2 Attack Neutralization Evidence:
1. Disguised Ad POST Exploit Attempt: Clicking the promotional campus partner ad and submitting the forged profile update on `attackerCsrfExploit.html` against port 5000 results in HTTP 403 Forbidden. The Anti CSRF token is missing and `SameSite: strict` withholds the session cookie. The administrator biography remains unchanged.
2. GET Based Voucher Action Attempt: Opening `attackerCsrfGetExploit.html` against port 5000 results in HTTP 405 Method Not Allowed. The discussion remains completely safe.
