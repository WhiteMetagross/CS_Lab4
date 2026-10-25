# Web Server Security Laboratory Viva Examination Preparation Guide:

## Question 1:
What is the core distinction between Version 1 and Version 2 in your submission?

### Answer:
1. Version 1 is the intentionally flawed reference edition running on local port 3000 that demonstrates real world exploits across four core vulnerability classes.
2. Version 2 is the hardened production grade edition running on local port 5000 that implements multi layered defenses neutralizing every demonstrated attack vector.

## Question 2:
What is SQL Injection and why did it occur in Version 1?

### Answer:
1. SQL Injection occurs when untrusted user supplied data is directly concatenated into a dynamic SQL query string instead of being treated as isolated literal data.
2. It occurred in Version 1 because the authentication login endpoint and discussion search endpoint interpolated user parameters directly into SQL command strings.

## Question 3:
How does the authentication bypass exploit work in Version 1?

### Answer:
1. The attacker enters `mridankan' --` in the username field with an arbitrary password.
2. The single quote closes the SQL string literal and the double dash comments out the remainder of the query, causing the database to authenticate the administrator record without validating the password.

## Question 4:
How does the UNION based data extraction exploit operate in Version 1?

### Answer:
1. The attacker inputs `' UNION SELECT id, username, password, bio FROM users --` into the discussion search field.
2. The database executes the UNION operator, appending confidential member records from the users table into the returned discussion search results.

## Question 5:
How do parameterized queries prevent SQL Injection in Version 2?

### Answer:
1. Parameterized queries pre compile the SQL command structure using placeholder parameter markers before binding user supplied values.
2. The database engine treats the bound parameters strictly as literal data values, making it impossible for input characters like quotes or dashes to alter the SQL syntax tree.

## Question 6:
What additional defenses against SQL Injection were implemented in Version 2?

### Answer:
1. Strict regular expression allow lists validate that inputs contain only permitted alphanumeric characters before reaching database drivers.
2. Safe generic error handling returns standardized error messages, preventing attackers from learning database schema details or syntax errors.

## Question 7:
What is the principle of least privilege in the context of database accounts?

### Answer:
1. The database account used by the web application should only have the minimal set of permissions required for normal operation, such as SELECT, INSERT, and UPDATE on specific tables.
2. Administrative privileges such as DROP TABLE, ALTER SCHEMA, or access to system metadata tables should be strictly prohibited.

## Question 8:
What is OS Command Injection and what was its root cause in Version 1?

### Answer:
1. OS Command Injection occurs when an application executes system level commands where user supplied input is passed directly to an operating system shell interpreter.
2. In Version 1, the diagnostic ping endpoint concatenated user input directly into system commands executed using `child_process.exec`.

## Question 9:
What is the difference between in band and blind command injection?

### Answer:
1. In band command injection occurs when the executed command terminal output is returned directly in the application HTTP response.
2. Blind command injection occurs when no command output is returned to the user, requiring the attacker to infer execution through side channels like time delays or external network interactions.

## Question 10:
How did you demonstrate in band command injection in Version 1?

### Answer:
1. In the diagnostic node ping input, we supplied `127.0.0.1 & whoami`.
2. The shell executed the ping command followed immediately by `whoami`, returning the current operating system user account directly on screen.

## Question 11:
How did you demonstrate blind command injection in Version 1?

### Answer:
1. In the background archiver task input, we supplied `telemetry & ping -n 6 127.0.0.1`.
2. The server paused execution for over five seconds while waiting for the ping delay to complete before responding, confirming arbitrary command execution.

## Question 12:
Why does switching from `child_process.exec` to `child_process.execFile` mitigate command injection in Version 2?

### Answer:
1. The `child_process.exec` function invokes a system shell interpreter like `cmd.exe` or `/bin/sh` that parses metacharacters such as ampersands and semicolons as command separators.
2. The `child_process.execFile` function executes binary files directly without spawning a shell, passing parameters strictly as an array argument vector where metacharacters are treated as literal text.

## Question 13:
What regular expression allow list was implemented for destination host validation in Version 2?

### Answer:
1. Destination hosts are verified against a regular expression permitting only valid domain names or IPv4 address octets.
2. Any input containing shell metacharacters such as ampersands, pipes, semicolons, or dollar signs is immediately rejected with HTTP 400 Bad Request.

## Question 14:
What is Cross Site Scripting and why did it occur in Version 1?

### Answer:
1. Cross Site Scripting occurs when an application includes untrusted user supplied data in a web page delivered to other users without contextual output encoding or sanitization.
2. In Version 1, the `ContentRenderer.jsx` component inserted user content directly into the DOM using `innerHTML` and actively executed embedded script elements.

## Question 15:
What is the difference between Stored XSS and Reflected XSS?

### Answer:
1. Stored XSS occurs when malicious script payloads are permanently saved in the backend database and executed whenever any user views the stored record.
2. Reflected XSS occurs when an immediate user input like a search query parameter is reflected back into the webpage response without persistent storage.

## Question 16:
How does DOMPurify sanitize user input in Version 2?

### Answer:
1. DOMPurify parses HTML into a DOM tree, traverses each node, and strips dangerous elements like `script`, `iframe`, `object`, and `embed`.
2. It strictly removes dangerous inline event handler attributes like `onerror`, `onload`, and `onclick`, leaving only safe structural tags.

## Question 17:
What is Content Security Policy and how does it protect against XSS?

### Answer:
1. Content Security Policy is an HTTP response header that instructs the browser which sources of executable scripts, stylesheets, and resources are authorized.
2. In Version 2, our CSP restricts script execution to scripts loaded from the same origin and forbids inline script execution.

## Question 18:
How does the `HttpOnly` flag on cookies protect against Cross Site Scripting?

### Answer:
1. The `HttpOnly` attribute blocks client side JavaScript code from reading the cookie through `document.cookie`.
2. Even if an attacker manages to execute JavaScript in the browser, they cannot steal the authenticated session token.

## Question 19:
What is Cross Site Request Forgery and why does it occur?

### Answer:
1. Cross Site Request Forgery occurs when an external malicious web application coerces an authenticated victim browser into sending unauthorized state changing requests to a vulnerable application.
2. It occurs because browsers automatically attach all stored ambient credentials like cookies to outgoing requests directed to the target domain regardless of request origin.

## Question 20:
What is an Anti CSRF synchronizer token and how does it prevent CSRF attacks?

### Answer:
1. An Anti CSRF synchronizer token is a cryptographically strong unpredictable secret value generated by the server for each active user session.
2. State changing requests must include this token, which the server compares against the session record. External malicious sites cannot read the token due to the Same Origin Policy.

## Question 21:
How does the React client in Version 2 retrieve and transmit the Anti CSRF token?

### Answer:
1. Upon login, the client receives the synchronizer token in the authentication response and stores it in application state.
2. A custom fetch interceptor automatically attaches the token inside the `X-CSRF-Token` header on all non GET HTTP requests.

## Question 22:
What is the `SameSite: strict` cookie attribute and how does it mitigate CSRF?

### Answer:
1. The `SameSite` attribute controls whether cookies are sent with cross site requests initiated from third party web domains.
2. The `SameSite: strict` directive instructs the browser never to include the session cookie on any cross site request, completely preventing ambient credential leakage.

## Question 23:
How does Origin and Referer header verification work as a defensive measure?

### Answer:
1. Server middleware inspects the `Origin` and `Referer` headers delivered with incoming HTTP requests.
2. If the request header indicates an untrusted foreign domain origin, the server rejects the request with HTTP 403 Forbidden before executing any database changes.

## Question 24:
Why are state changing operations strictly prohibited on HTTP GET requests in Version 2?

### Answer:
1. HTTP GET requests are defined by specification to be safe and idempotent operations intended only for data retrieval.
2. If state changes are permitted on GET requests, attackers can trigger unauthorized actions simply by embedding URLs inside image tags or links on external pages.

## Question 25:
What HTTP response codes does Version 2 return when attacks are blocked?

### Answer:
1. SQL injection and command injection attempts with invalid characters return HTTP 400 Bad Request.
2. CSRF attacks with missing synchronizer tokens or untrusted origins return HTTP 403 Forbidden.
3. Attempting state changing operations via GET requests returns HTTP 405 Method Not Allowed.
