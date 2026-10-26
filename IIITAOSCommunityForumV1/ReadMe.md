# IIIT Allahabad Open Source Community Forum: Version 1 (Vulnerable Edition):

## Group 1 Members:
1. Mridankan Mandal: IIB2024017.
2. Aditya Pachauri: IIB2024001.
3. Ankit Ekka: IIB2024012.
4. Dhannu Ram Meena: IIB2024033.

## 1. Table 3: Individual Member Ownership Declaration:
1. Member Name: Mridankan Mandal. Roll Number: IIB2024017. Category: Cross Site Request Forgery (CSRF). Variant Implemented: Variant 2 POST based forged action with auto submitting form and Variant 1 GET based forged action.
2. Member Name: Aditya Pachauri. Roll Number: IIB2024001. Category: SQL Injection. Variant Implemented: Variant 1 Authentication bypass and Variant 2 UNION based data extraction.
3. Member Name: Ankit Ekka. Roll Number: IIB2024012. Category: OS Command Injection. Variant Implemented: Variant 1 In band command output returned and Variant 2 Blind time based command injection.
4. Member Name: Dhannu Ram Meena. Roll Number: IIB2024033. Category: Cross Site Scripting (XSS). Variant Implemented: Variant 1 Stored XSS and Variant 2 Reflected XSS.

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
5. Attacker Exploit Portals: Access `http://localhost:3000/attackerCsrfExploit.html` and `http://localhost:3000/attackerCsrfGetExploit.html`.
