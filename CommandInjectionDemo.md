# OS Command Injection Demonstration and Defense Manual:

### Web Application: IIIT Allahabad Open Source Community Forum:
### Assigned Presenter: Ankit Ekka (Roll Number: IIB2024012):
### Focus Variant: In-Band Diagnostics Ping Command Output Execution:

---

## 1. What is OS Command Injection:

1. Technical Definition:
   Operating System (OS) Command Injection occurs when an application executes host system shell commands and includes untrusted, user-supplied input directly within the command string without validation or shell separation.
2. The Code Versus Data Dilemma in Command Shells:
   System command interpreters (such as `cmd.exe` on Windows or `/bin/sh` on Linux) assign syntactic control meaning to specific metacharacters (including `&`, `&&`, `|`, `||`, `;`, and backticks). When user-supplied text containing these characters is concatenated into a command string, the shell parser treats the data as additional command instructions rather than literal arguments.
3. Real World Threat Impact:
   Command injection is one of the most critical web server vulnerabilities. It allows remote attackers to execute arbitrary system commands under the operating system privileges of the web server process. Attackers can read sensitive files, download and install backdoors, pivot across internal networks, or completely compromise the host server.

---

## 2. How the In-Band Command Injection Exploit Happens:

1. Insecure Code Logic in Version 1:
   The diagnostics route handler in [diagnostics.js (V1)](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js) takes the `host` parameter from the HTTP request body and concatenates it directly into a system command string passed to `child_process.exec`:
   ```javascript
   const host = req.body.host || '127.0.0.1';
   const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;
   exec(command, (error, stdout, stderr) => { ... });
   ```
2. Attacker Input:
   - Destination Node Field: `127.0.0.1 & whoami`
3. Command Line Evaluated by the Operating System Shell:
   When concatenated, the command string becomes:
   ```cmd
   ping -n 2 127.0.0.1 & whoami
   ```
4. Step by Step Mechanics:
   - The Node.js `exec` function spawns an underlying operating system shell (`cmd.exe` on Windows or `/bin/sh` on Unix).
   - The shell parses the entire command string from left to right.
   - When encountering the unquoted ampersand `&`, the shell interprets it as a sequential command separator.
   - The shell first executes `ping -n 2 127.0.0.1` and outputs the ICMP ping responses.
   - Immediately following the ping execution, the shell executes the secondary injected command: `whoami`.
   - The standard output stream (`stdout`) captures the console output of both `ping` and `whoami`.
   - The server packages this raw output into a JSON response payload (`output: stdout || stderr`), displaying the server operating system username directly in the diagnostics console interface.

---

## 3. How OS Command Injection is Defended:

### Defense 1: Avoiding the Shell via `child_process.execFile` with Argument Vectors:
1. Mechanism:
   Instead of invoking an intermediate command shell interpreter that parses metacharacters, the server uses `child_process.execFile` with `shell: false`.
2. Implementation:
   The binary executable `ping` is invoked directly by the operating system kernel, and all options and user parameters are passed as discrete elements of an argument vector array:
   ```javascript
   const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];
   execFile('ping', pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => { ... });
   ```
3. Defense Effect:
   Because no shell interpreter is ever spawned, metacharacters such as `&`, `|`, and `;` lose their command chaining ability. If an attacker submits `127.0.0.1 & whoami`, the ping binary treats `127.0.0.1 & whoami` purely as an invalid literal destination hostname and fails harmlessly, completely preventing secondary command execution.

### Defense 2: Input Validation Allow Lists:
1. Mechanism:
   All incoming parameters are validated against strict regular expression allow lists at the application boundary prior to any operational processing.
2. Implementation:
   A strict regular expression verifies that the host parameter matches only valid IPv4 addresses or standard domain names:
   ```javascript
   const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;
   if (!host || !hostPattern.test(host)) {
     return res.status(400).json({
       error: 'Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators or shell metacharacters.'
     });
   }
   ```
3. Defense Effect:
   Any request containing command separators (`&`, `|`, `;`), spaces, redirect symbols (`>`, `<`), or non-hostname characters is rejected immediately with HTTP 400 Bad Request before reaching the process execution layer.

### Defense 3: Principle of Least Privilege:
1. Mechanism:
   Application server processes should always run under dedicated low-privilege service accounts rather than root or administrative accounts, restricting file access and administrative system actions even if code execution were attempted.

---

## 4. Source Code Comparison:

### Vulnerable Source Code:
File Location: [IIITAOSCommunityForumV1/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js)
```javascript
//This does execute in band command injection via shell concatenation.
router.post('/ping', (req, res) => {
  const host = req.body.host || '127.0.0.1';
  const command = process.platform === 'win32' ? 'ping -n 2 ' + host : 'ping -c 2 ' + host;

  exec(command, (error, stdout, stderr) => {
    return res.json({
      command,
      output: stdout || stderr || error?.message || 'Command executed without output.'
    });
  });
});
```

### Hardened Defended Source Code:
File Location: [IIITAOSCommunityForumV2/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/diagnostics.js)
```javascript
//Defense: Avoid the shell using execFile with argument vector, strict IP or hostname allow listing, and safe error responses.
router.post('/ping', (req, res) => {
  const host = (req.body.host || '').trim();

  //Defense: Strict allow list validation for hostname or IPv4 address.
  const hostPattern = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}|(\d{1,3}\.){3}\d{1,3})$/;

  if (!host || !hostPattern.test(host)) {
    return res.status(400).json({
      error: 'Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators or shell metacharacters.'
    });
  }

  //Defense: Avoid shell by passing arguments strictly as an array vector to execFile without a shell.
  const pingExecutable = 'ping';
  const pingArguments = process.platform === 'win32' ? ['-n', '2', host] : ['-c', '2', host];

  execFile(pingExecutable, pingArguments, { shell: false, timeout: 5000 }, (error, stdout, stderr) => {
    if (error && !stdout) {
      return res.status(500).json({
        output: 'Diagnostic ping failed: ' + (stderr || error.message)
      });
    }

    return res.json({
      command: pingExecutable + ' ' + pingArguments.join(' '),
      output: stdout || stderr || 'Ping completed successfully.'
    });
  });
});
```

---

## 5. Step by Step Demonstration Walkthrough:

### Step 1: Starting the Applications:
1. Terminal 1 (Version 1 Vulnerable Edition on port 3000):
   ```bash
   cd IIITAOSCommunityForumV1
   npm start
   ```
2. Terminal 2 (Version 2 Hardened Defended Edition on port 5000):
   ```bash
   cd IIITAOSCommunityForumV2
   npm start
   ```

### Step 2: Demonstrating the Exploit on Version 1 (`http://localhost:3000`):
1. Open your browser and navigate to `http://localhost:3000`.
2. Click on the `Diagnostics` tab in the top navigation bar.
3. Locate the card titled `Campus Server Diagnostics Portal`.
4. In the `Destination Node or Hostname` input field, enter:
   `127.0.0.1 & whoami`
5. Click `Execute Node Ping`.
6. Observe the result:
   The server processes the request and updates the `Diagnostic Console Output` box.
   Directly following the ping statistics, the terminal output displays the active operating system user account (for example, `hostname\username` or `root`).
   This demonstrates full arbitrary shell command execution on the host server.
7. Open [IIITAOSCommunityForumV1/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js) in your code editor to highlight `child_process.exec` and raw string concatenation on lines 8 to 10.

### Step 3: Demonstrating the Defense on Version 2 (`http://localhost:5000`):
1. Switch browser tab to `http://localhost:5000`.
2. Click on the `Diagnostics` tab in the top navigation bar.
3. Locate the card titled `Secured Campus Server Diagnostics Portal`.
4. In the `Destination Node or Hostname` input field, enter the exact same payload:
   `127.0.0.1 & whoami`
5. Click `Execute Node Ping`.
6. Observe the result:
   The command is rejected immediately.
   The console output displays an HTTP 400 error banner:
   `Error (400): Command Injection Defense: Input rejected. Host parameter must strictly match a valid IP address or domain hostname without command separators or shell metacharacters.`
   Zero system shell execution takes place, and the server refuses to run the command.
7. Open [IIITAOSCommunityForumV2/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/diagnostics.js) in your code editor to highlight:
   Line 11: Regular expression allow list checking `hostPattern.test(host)`.
   Line 23: Direct binary execution using `child_process.execFile` with argument vector array and `shell: false`.

---

## 6. Spoken Presentation and Video Demonstration Script:

### Presenter: Ankit Ekka (Roll Number: IIB2024012)
### Target Duration: 2 to 2.5 Minutes

### Visual Screen Action:
1. Show browser tab open at `http://localhost:3000`.
2. Click the `Diagnostics` tab in the top navigation bar.
3. In the Destination Node input field, enter `127.0.0.1 & whoami`.
4. Click `Execute Node Ping` and highlight the returned operating system username in the Diagnostic Console Output.
5. Open Visual Studio Code showing file [IIITAOSCommunityForumV1/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/diagnostics.js) lines 8 to 10.
6. Switch browser tab to `http://localhost:5000`.
7. Click the `Diagnostics` tab on Version 2.
8. Enter `127.0.0.1 & whoami` in the input field and click `Execute Node Ping`.
9. Highlight the red HTTP 400 error message rejecting command separators.
10. Open Visual Studio Code showing file [IIITAOSCommunityForumV2/server/routes/diagnostics.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/diagnostics.js) highlighting the regex allow list and `execFile` with argument vectors.

### Spoken Narration:
1. Hello everyone. I am Ankit Ekka, roll number IIB2024012, and I am demonstrating the OS Command Injection category.
2. Operating System Command Injection occurs when an application passes unsanitized user input directly to a system shell interpreter.
3. Because system shells treat characters like the ampersand, semicolon, and vertical bar as command separators, an attacker can append arbitrary system commands to legitimate application utilities.
4. On Version 1 of our forum running on port 3000, we provide a server diagnostics utility allowing coordinators to test destination connectivity.
5. In the Destination Node input, I will enter `127.0.0.1 & whoami`.
6. When I click Execute Node Ping, the server concatenates this string into a shell command.
7. The operating system shell executes the ping command and then immediately executes `whoami`.
8. As you can see in the Diagnostic Console Output, the server returns both the ping statistics and the active host operating system username.
9. Looking at the vulnerable code in `IIITAOSCommunityForumV1/server/routes/diagnostics.js`, we can observe the root cause: the host variable is concatenated directly into the shell string and executed via `child_process.exec`.
10. Now let us examine our defense on Version 2, running on port 5000.
11. When I submit the identical payload `127.0.0.1 & whoami` into the secured diagnostics portal, the request is immediately rejected with HTTP 400 Bad Request.
12. The console displays our defense error, stating that the host parameter must strictly match a valid IP address or domain hostname without command separators.
13. Looking at the defense implementation in `IIITAOSCommunityForumV2/server/routes/diagnostics.js`, we eliminated command injection through two key mechanisms.
14. First, a strict regular expression allow list verifies that the target is strictly a valid IP address or domain name before any execution begins.
15. Second, we completely avoid the command shell by using `child_process.execFile` with `shell: false`, passing the ping binary and options as discrete elements of an argument vector array.
16. Because no shell interpreter is invoked, metacharacters cannot be interpreted, ensuring complete defense against OS command injection.
