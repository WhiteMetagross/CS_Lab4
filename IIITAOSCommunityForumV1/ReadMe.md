# IIIT Allahabad Open Source Community Forum: Version 1 (Vulnerable Edition):

## Group 1 Members:
1. Mridankan Mandal: IIB2024017.
2. Aditya Pachauri: IIB2024001.
3. Ankit Ekka: IIB2024012.
4. Dhannu Ram Meena: IIB2024033.

## 1. Individual Member Task Allocation Table:

| Member Name | Roll Number | Vulnerability Category | Implemented Attack Variants | Implemented Defense Architecture |
| :--- | :--- | :--- | :--- | :--- |
| Aditya Pachauri | IIB2024001 | Cross Site Request Forgery (CSRF) | Variant 1: POST Based Forged Action via Disguised Campus Ad<br>Variant 2: GET Based Forged Action via Voucher Link | Cryptographic Anti CSRF Synchronizer Tokens, Strict SameSite and HttpOnly Cookies, Origin and Referer Header Verification, Rejection of State Changing GET Requests with HTTP 405 |
| Mridankan Mandal | IIB2024017 | Cross Site Scripting (XSS) | Variant 1: Stored XSS Interactive DOM and Session Takeover<br>Variant 2: Reflected XSS via Disguised Free Swag Phishing Ad | DOMPurify HTML Sanitization, React Framework Auto Escaping, HTTP Content Security Policy (CSP) Headers, HttpOnly Session Cookies |
| Dhannu Ram Meena | IIB2024033 | SQL Command Injection (SQL Injection) | Variant 1: Authentication Login Bypass<br>Variant 2: UNION Based Sensitive Data Extraction | Parameterized Prepared Statements (`db.prepare`), Strict Alphanumeric Regular Expression Whitelisting, Safe Generic Error Messages |
| Ankit Ekka | IIB2024012 | OS Command Injection | Variant 1: In Band Diagnostic Command Output Execution<br>Variant 2: Blind Time Based Diagnostics Archiver Delay | Avoiding the Shell via `child_process.execFile` with Argument Vectors, Host Regex Allow List Enforcement, Static Whitelist Mapping for Background Tasks |

## 2. Directory Purpose and Overview:
1. This directory contains Version 1 of the web application, which contains deliberate architectural flaws across four vulnerability classes.
2. The server runs on local port 3000 and connects to an embedded SQLite database in `server/forum.db`.
3. The application demonstrates real world exploitation including authentication bypass, data extraction, arbitrary shell execution, stored and reflected XSS, and cross site request forgery.

## 3. Vulnerability Map in Version 1:
1. SQL Injection Authentication Bypass: Located in `server/routes/auth.js` in `POST /api/auth/login`. Concatenates input directly into SQL strings.
2. SQL Injection UNION Extraction: Located in `server/routes/posts.js` in `GET /api/posts/search`. Allows extracting the `users` table via UNION query.
3. OS Command Injection In Band: Located in `server/routes/diagnostics.js` in `POST /api/diagnostics/ping`. Uses `child_process.exec` concatenating host input into shell command.
4. OS Command Injection Blind: Located in `server/routes/diagnostics.js` in `POST /api/diagnostics/archive`. Executes shell commands in background without output.
5. Cross Site Scripting Stored: Located in `client/src/components/ContentRenderer.jsx`. Inserts untrusted user HTML directly into `innerHTML` and runs `<script>` tags.
6. Cross Site Scripting Reflected: Located in `client/src/components/ForumView.jsx`. Reflects unescaped search queries into the DOM.
7. Cross Site Request Forgery GET: Located in `server/routes/posts.js` in `GET /api/posts/delete-by-get`. Deletes posts via ambient cookie on GET.
8. Cross Site Request Forgery POST: Located in `server/routes/auth.js` in `POST /api/auth/profile`. Updates user biographies via ambient cookie without anti CSRF tokens.

## 4. Setup and Execution:
1. Installation:
```bash
npm install
```
2. Client Build:
```bash
npm run build
```
3. Start Application:
```bash
npm start
```
4. Access Application: Open `http://localhost:3000` in your web browser.
5. Attacker Exploit and Phishing Portals: Access `http://localhost:3000/attackerCsrfExploit.html`, `http://localhost:3000/attackerCsrfGetExploit.html`, and `http://localhost:3000/attackerPhishingAd.html`.
