# IIIT Allahabad Open Source Community Forum Web Server Security Repository:

## 1. Table 3: Individual Member Ownership Declaration:
1. Member Name: Mridankan Mandal. Roll Number: IIB2024017. Category: Cross Site Request Forgery (CSRF). Variant Implemented: Variant 2 POST based forged action with auto submitting form and Variant 1 GET based forged action.
2. Member Name: Aditya Pachauri. Roll Number: IIB2024001. Category: SQL Injection. Variant Implemented: Variant 1 Authentication bypass and Variant 2 UNION based data extraction.
3. Member Name: Ankit Ekka. Roll Number: IIB2024012. Category: OS Command Injection. Variant Implemented: Variant 1 In band command output returned and Variant 2 Blind time based command injection.
4. Member Name: Dhannu Ram Meena. Roll Number: IIB2024033. Category: Cross Site Scripting (XSS). Variant Implemented: Variant 1 Stored XSS and Variant 2 Reflected XSS.

## 2. Project Introduction:
1. This repository contains the complete implementation, vulnerability exploitation evidence, and multi layered defense remediation for the IIIT Allahabad Open Source Community Forum web application.
2. The project fulfills the requirements of Cyber Security course IT30001 covering four core web server vulnerability categories: SQL Injection, OS Command Injection, Cross Site Scripting, and Cross Site Request Forgery.
3. The codebase is structured into two distinct standalone versions enabling direct side by side security assessment and demonstration.
4. Version 1 located in directory `IIITAOSCommunityForumV1` contains intentionally flawed code paths demonstrating the mechanics and impact of real world attacks.
5. Version 2 located in directory `IIITAOSCommunityForumV2` incorporates multi layered defense architectures neutralizing all demonstrated attack vectors.

## 3. Repository Structure and Folder Contents:

### 3.1 Directory `IIITAOSCommunityForumV1`:
1. Purpose: Contains the vulnerable edition of the full stack web application running on local port 3000.
2. Backend Code: Located in `server/server.js`, `server/database.js`, and API route handlers in `server/routes/auth.js`, `server/routes/posts.js`, `server/routes/chat.js`, and `server/routes/diagnostics.js`.
3. Frontend Code: React client application built with Vite located in `client/` and served via compiled static production assets in `public/`.
4. Attacker Exploit Portals: Contains `public/attackerCsrfExploit.html` for POST based CSRF auto submission and `public/attackerCsrfGetExploit.html` for GET based CSRF demonstrations.
5. Documentation: Contains `ReadMe.md` and `Vulnerable.md` detailing vulnerable code paths and step by step exploit walkthroughs.

### 3.2 Directory `IIITAOSCommunityForumV2`:
1. Purpose: Contains the hardened defended edition of the application running on local port 5000.
2. Backend Code: Hardened Express server with Content Security Policy headers, parameterized SQLite queries, input validation allow lists, `child_process.execFile` execution, and Anti CSRF token verification middleware.
3. Frontend Code: Hardened React client with DOMPurify sanitization in `client/src/components/ContentRenderer.jsx`, automatic CSRF token interception in `client/src/App.jsx`, and safe framework text auto escaping.
4. Defense Verification Portals: Contains `public/attackerCsrfExploit.html` and `public/attackerCsrfGetExploit.html` configured for port 5000 to demonstrate attack rejection.
5. Documentation: Contains `ReadMe.md` and `Defended.md` detailing implemented multi layered security controls.

### 3.3 Root Documentation Files:
1. `DemoScript.md`: Complete video recording demonstration script with timed acts, screen actions, and member narrations.
2. `Explainations.md`: In depth technical deep dive covering vulnerability theory, root causes, exploit mechanics, multi layered defenses, and slide mitigation concepts.
3. `Vulnerable.md`: Exhaustive attack guide and vulnerability analysis for Version 1.
4. `Defended.md`: Comprehensive defense architectural breakdown for Version 2.

## 4. Technology Stack:
1. Runtime Environment: Node.js version 22 LTS execution environment.
2. Web Framework: Express web framework version 4.21.
3. Database Engine: Native embedded SQLite engine using `node:sqlite` DatabaseSync with storage in `server/forum.db`.
4. Frontend Interface: React version 19 user interface styled with professional white card theme and responsive layouts.
5. Build Tooling: Vite version 8 bundler compiling React code into static assets.
6. Security Libraries: DOMPurify version 3 for rich HTML sanitization in Version 2.

## 5. Summary of the Four Vulnerability Categories and Implemented Defenses:

### 5.1 Category 1: SQL Injection:
1. Vulnerability Flaws in Version 1: Dynamic string concatenation in authentication login queries and forum discussion search queries.
2. Exploit Variant 1 Authentication Bypass: Submitting username `mridankan' --` with any password allows logging in as the administrator without authentication.
3. Exploit Variant 2 UNION Based Data Extraction: Submitting `' UNION SELECT id, username, password, bio FROM users --` in forum search extracts user credentials and passwords directly into search results.
4. Multi Layered Defenses in Version 2: Parameterized prepared statements with `db.prepare`, strict regular expression allow lists rejecting quotes and metacharacters, and safe generic error messages.

### 5.2 Category 2: OS Command Injection:
1. Vulnerability Flaws in Version 1: Usage of `child_process.exec` concatenating unsanitized user host inputs into operating system shell commands.
2. Exploit Variant 1 In Band Command Output Returned: Submitting `127.0.0.1 & whoami` executes the secondary command and returns terminal output directly to the client interface.
3. Exploit Variant 2 Blind Time Based Injection: Submitting `telemetry & ping -n 6 127.0.0.1` causes an observable delay of five seconds during background task scheduling.
4. Multi Layered Defenses in Version 2: Complete avoidance of shell by using `child_process.execFile` with separate argument vector arrays, strict destination hostname and IPv4 allow list validation, and static whitelist mapping for background tasks.

### 5.3 Category 3: Cross Site Scripting (XSS):
1. Vulnerability Flaws in Version 1: Rendering untrusted user content directly via unescaped `innerHTML` and dynamically executing embedded script tags.
2. Exploit Variant 1 Stored XSS: Storing interactive DOM takeover payload inside discussion posts triggers real time navbar brand modification, ambient cookie dumping, dynamic theme inversion, and live notification toasts for all visiting users.
3. Exploit Variant 2 Reflected XSS: Submitting unencoded search queries injects attack confirmation error banners directly into the DOM interface.
4. Multi Layered Defenses in Version 2: DOMPurify sanitization with strict element and attribute allow lists, React framework auto escaping, HTTP Content Security Policy response headers, and HttpOnly session cookies.

### 5.4 Category 4: Cross Site Request Forgery (CSRF):
1. Vulnerability Flaws in Version 1: Ambient cookie transmission on cross origin requests, absence of anti CSRF synchronizer tokens, and lack of origin verification.
2. Exploit Variant 1 GET Based Forged Action: Embedded image or link requesting `http://localhost:3000/api/posts/delete-by-get?id=3` deletes discussions silently via ambient cookie.
3. Exploit Variant 2 POST Based Forged Action via Disguised Campus Ad: Disguised campus partner ad cards embedded in the forum sidebar and feed lure victims to an external student credit portal that auto submits forged profile data without consent.
4. Multi Layered Defenses in Version 2: Cryptographic 256 bit anti CSRF synchronizer tokens, `SameSite: strict` and `HttpOnly: true` cookie directives, server side Origin and Referer header verification, and strict rejection of state changing GET requests with HTTP 405.

## 6. Preconfigured Community Accounts:
1. Mridankan Mandal: Username is `mridankan` with password `mridankan123` and role `Administrator`.
2. Ankit Ekka: Username is `ankit` with password `ankit123` and role `Contributor`.
3. Dhannu Ram Meena: Username is `dhannu` with password `dhannu123` and role `Contributor`.
4. Aditya Pachauri: Username is `aditya` with password `aditya123` with role `Student`.
5. Sayan Samajpati: Username is `sayan` with password `sayan123` with role `Student`.
6. Lucky Raut: Username is `lucky` with password `lucky123` with role `Student`.

## 7. Setup and Execution Instructions:

### 7.1 Running Version 1 (Vulnerable Edition):
1. Open a terminal window and navigate to the Version 1 folder.
```bash
cd IIITAOSCommunityForumV1
npm install
npm run build
npm start
```
2. Open your web browser and navigate to `http://localhost:3000`.

### 7.2 Running Version 2 (Hardened Defended Edition):
1. Open a second terminal window and navigate to the Version 2 folder.
```bash
cd IIITAOSCommunityForumV2
npm install
npm run build
npm start
```
2. Open your web browser and navigate to `http://localhost:5000`.

### 7.3 Restoring Seed Data:
1. If database state needs resetting at any point, send a POST request to `/api/admin/reset-db` on the corresponding server port.
