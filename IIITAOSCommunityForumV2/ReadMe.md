# IIIT Allahabad Open Source Community Forum: Version 2 (Hardened Defended Edition):

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
1. This directory contains Version 2 of the web application, where all vulnerabilities identified in Version 1 have been completely remediated.
2. The server runs on local port 5000 and implements multi layered defense in depth mechanisms.
3. Defenses span Content Security Policy headers, parameterized prepared statements, regex allow list validations, safe execution without shells via `child_process.execFile`, DOMPurify HTML sanitization, and cryptographic Anti CSRF synchronizer tokens.

## 3. Implemented Defenses in Version 2:
1. SQL Injection Defenses: Parameterized prepared statements in `server/routes/auth.js` and `server/routes/posts.js`, input validation allow lists, and safe generic error messages.
2. OS Command Injection Defenses: Avoidance of shell execution by utilizing `child_process.execFile` with separate argument vector arrays in `server/routes/diagnostics.js`, strict IPv4 and hostname regex whitelisting, and static task mapping.
3. Cross Site Scripting Defenses: DOMPurify sanitization in `client/src/components/ContentRenderer.jsx`, React JSX framework auto escaping, HTTP Content Security Policy response headers, and HttpOnly session cookies.
4. Cross Site Request Forgery Defenses: Cryptographic 256 bit Anti CSRF synchronizer tokens, `SameSite: strict` and `HttpOnly: true` cookies, Origin and Referer header verification, and rejection of state changing GET requests with HTTP 405.

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
4. Access Application: Open `http://localhost:5000` in your web browser.
5. Defense Verification Portals: Access `http://localhost:5000/attackerCsrfExploit.html` and `http://localhost:5000/attackerCsrfGetExploit.html` to observe rejection of cross site attacks.
