# IIIT Allahabad Open Source Community Forum: Version 2 (Hardened Defended Edition):

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
5. Defense Verification Portals: Access `http://localhost:5000/attackerCsrfExploit.html`, `http://localhost:5000/attackerCsrfGetExploit.html`, and `http://localhost:5000/attackerPhishingAd.html` to observe rejection of cross site attacks and reflected phishing scripts.
