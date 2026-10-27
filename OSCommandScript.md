# OS Command Injection Concise Presentation Script and Guide:

### Web Application: IIIT Allahabad Open Source Community Forum:
### Assigned Presenter: Ankit Ekka (Roll Number: IIB2024012):
### Target Presentation Duration: 2 Minutes:

---

## 1. What is OS Command Injection:

1. Definition:
   Operating System (OS) Command Injection is a security vulnerability where an application executes operating system level commands and inserts untrusted user input directly into the command string without validation or shell isolation.
2. The Mechanism:
   Operating system shells (like Windows `cmd.exe` or Linux `/bin/sh`) evaluate special metacharacters like `&`, `&&`, `|`, and `;` as command separators. When user input contains these characters, the shell interprets the additional input as new system commands rather than plain text data.

---

## 2. Why is it Done (Attacker Motivation and Objectives):

1. Remote Code Execution:
   The primary goal of an attacker is arbitrary code execution. It allows the attacker to run native operating system commands directly on the server hosting the application.
2. System Reconnaissance and Data Theft:
   Attackers run commands like `whoami`, `dir`, `ls`, or `cat /etc/passwd` to discover operating system details, network configuration, database credentials, and confidential files stored on the host.
3. Persistent Compromise:
   Attackers can download backdoors, create rogue system user accounts, pivot into internal campus networks, or disrupt critical university services.

---

## 3. How the Exploit Works on Version 1:

1. Target Feature:
   The `Diagnostics` tab on `http://localhost:3000` (`Campus Server Diagnostics and Connectivity`).
2. Vulnerable Source Code:
   In [diagnostics.js (V1)](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js):
   ```javascript
   const host = req.body.host || '127.0.0.1';
   const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;
   exec(command, (error, stdout, stderr) => { ... });
   ```
3. Injected Payload:
   `127.0.0.1 & whoami`
4. Shell Evaluation:
   The concatenated command becomes `ping -n 2 127.0.0.1 & whoami`.
   The shell executes `ping` and immediately executes `whoami`. The combined terminal output containing the operating system username (`tojolegion\xeron`) is returned directly in the response.

---

## 4. How to Defend OS Command Injection:

1. Avoid the Shell via `child_process.execFile` with Argument Vectors:
   Do not spawn a shell interpreter (`shell: false`). Pass the command and its arguments as discrete elements of an array:
   ```javascript
   const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];
   execFile('ping', pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => { ... });
   ```
   Without a shell interpreter, metacharacters such as `&` lose all command chaining ability.
2. Strict Allow List Validation:
   Validate all target inputs against a strict regular expression before execution:
   ```javascript
   const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;
   ```
   Any input with command separators, spaces, or metacharacters is immediately rejected with HTTP 400.
3. Principle of Least Privilege:
   Run the web server under a low-privilege service account to restrict damages if execution occurs.

---

## 5. Concise Spoken Script for Video Recording:

### Presenter: Ankit Ekka (Roll Number: IIB2024012):
### Duration: ~2 Minutes:

### Part 1: Introduction (0:00 to 0:25):
1. Screen: Show the Version 1 forum homepage at `http://localhost:3000`.
2. Spoken Words:
   "Hello everyone. I am Ankit Ekka, roll number IIB2024012. Today I am demonstrating OS Command Injection and its defense.
   OS Command Injection occurs when an application passes unvalidated user input directly to an operating system shell.
   Attackers exploit this to execute arbitrary system commands, extract sensitive files, and take over the underlying host server."

### Part 2: Demonstrating the Exploit on Version 1 (0:25 to 1:05):
1. Screen: Click the `Diagnostics` tab on `http://localhost:3000`. In `Destination Node or Hostname`, type `127.0.0.1 & whoami`. Click `Execute Node Ping`.
2. Spoken Words:
   "On Version 1 of our forum running on port 3000, we provide a network diagnostics utility.
   In the destination field, I input `127.0.0.1 & whoami` and click Execute Node Ping.
   Looking at the Diagnostic Console Output, we can see the ping statistics, and immediately below it, the host system username `tojolegion\xeron`.
   The shell interpreted the ampersand as a command separator and executed `whoami`, proving full command execution."

### Part 3: Vulnerable Code Review (1:05 to 1:25):
1. Screen: Open [diagnostics.js (V1)](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js) lines 8 to 14.
2. Spoken Words:
   "Examining the code in Version 1, the root cause is evident. The user input is concatenated directly into a string and passed to `child_process.exec`, which invokes the system shell parser."

### Part 4: Demonstrating the Defense on Version 2 (1:25 to 1:45):
1. Screen: Switch to `http://localhost:5000`. Click `Diagnostics`. Enter `127.0.0.1 & whoami`. Click `Execute Node Ping`.
2. Spoken Words:
   "Now let us examine the defense in Version 2 on port 5000.
   When I enter the exact same payload `127.0.0.1 & whoami` and submit, the server rejects the request immediately with an HTTP 400 error.
   The console displays our defense notice stating that command separators and shell metacharacters are rejected."

### Part 5: Defended Code Review and Conclusion (1:45 to 2:05):
1. Screen: Open [diagnostics.js (V2)](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/diagnostics.js) lines 10 to 24.
2. Spoken Words:
   "Looking at our defense in Version 2, we implement two layers of security.
   First, a regular expression allow list verifies that the input contains only valid hostnames or IP addresses.
   Second, we replace `exec` with `child_process.execFile` using `shell: false`. Arguments are passed as an isolated array vector, so no shell is ever invoked and command separators cannot be executed.
   Thank you."

---

## 6. Quick Demo Cheat Sheet:

1. Start V1: `cd IIITAOSCommunityForumV1 && npm start` (runs on port 3000).
2. Start V2: `cd IIITAOSCommunityForumV2 && npm start` (runs on port 5000).
3. V1 URL: `http://localhost:3000` -> Click `Diagnostics` tab.
4. V2 URL: `http://localhost:5000` -> Click `Diagnostics` tab.
5. Injected Payload: `127.0.0.1 & whoami`
6. V1 Expected Output: Ping details followed by `tojolegion\xeron`.
7. V2 Expected Output: Red HTTP 400 error banner rejecting shell metacharacters.
