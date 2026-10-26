# Video Demonstration Script:

### Assignment: Web Server Security Exploitation and Mitigation:

### Total Target Duration: 10 to 12 Minutes Total:

### Web Application: IIIT Allahabad Open Source Community Forum:

### Tone: Clear, Technical, Academic, Structured:

## Act 1: Introduction and Platform Architecture Overview (2 Minutes):

### Screen Action:
1. Open the project repository in Visual Studio Code.
2. Show the folder structure with `IIITAOSCommunityForumV1` and `IIITAOSCommunityForumV2`.
3. Open `http://localhost:3000` in the browser showing Version 1.
4. Briefly navigate the Discussions, Live Chat, Member Profiles, and Diagnostics tabs.

### Narration:
1. Hello everyone. Today our group will present our practical implementation and defense analysis for Cyber Security Assignment Web Server Security.
2. Our group members are Mridankan Mandal, Aditya Pachauri, Ankit Ekka, and Dhannu Ram Meena.
3. We have implemented our security experiments on the IIIT Allahabad Open Source Community Forum.
4. The application is built using Node.js, Express, native SQLite, and React.
5. Our submission provides two standalone editions of the complete web application.
6. Version 1 runs on port 3000 and contains vulnerable code paths across four core categories.
7. Version 2 runs on port 5000 and implements multi layered defenses protecting against every attack variant.
8. Each team member will now demonstrate their assigned category on both versions.

## Act 2: SQL Injection Exploitation and Defense by Aditya Pachauri (2.5 Minutes):

### Screen Action:
1. On Version 1 at `http://localhost:3000`, open the Account Login dialog.
2. In the username input, enter `mridankan' --` and enter an arbitrary password `wrongpass`.
3. Click Sign In and demonstrate successful authentication as Administrator Mridankan Mandal without knowing the password.
4. Navigate to Discussions and enter the search payload `' UNION SELECT id, username, password, bio FROM users --` into the search field.
5. Click Search and show confidential member passwords extracted directly into the discussion feed.
6. Open `IIITAOSCommunityForumV1/server/routes/auth.js` and `posts.js` to highlight dynamic SQL query string concatenation.
7. Switch to Version 2 at `http://localhost:5000`.
8. Attempt the login bypass with `mridankan' --`.
9. Show the HTTP 400 rejection banner stating disallowed characters were detected by input validation.
10. Attempt the search UNION injection with `' UNION SELECT id, username, password, bio FROM users --`.
11. Show the query rejection and open `IIITAOSCommunityForumV2/server/routes/auth.js` to highlight parameterized prepared statements and allow list regex validation.

### Narration:
1. I am Aditya Pachauri, roll number IIB2024001, and I am demonstrating the SQL Injection category.
2. In Version 1, user credentials and search queries are concatenated directly into raw SQL query strings.
3. When I submit the username `mridankan' --`, the single quote breaks out of the string literal and the double dash comments out the remainder of the query.
4. The database authenticates the administrator record immediately, bypassing the password check entirely.
5. In addition, our forum search endpoint is vulnerable to UNION based data extraction.
6. By injecting `' UNION SELECT id, username, password, bio FROM users --`, SQLite concatenates rows from the users table, revealing plaintext passwords directly on screen.
7. The root cause is the lack of parameterization, which allows user input to alter the syntactic structure of SQL commands.
8. To defend against this in Version 2, we implemented multiple layers of security.
9. First, all queries use parameterized prepared statements with `db.prepare` and placeholder parameter markers, ensuring user input is treated solely as literal data.
10. Second, we enforce strict input validation using alphanumeric regular expression allow lists that reject quotation marks and SQL metacharacters.
11. Third, we employ safe generic error responses so that database internals and query structures are never leaked.
12. As demonstrated on Version 2, identical exploit payloads are immediately rejected.

## Act 3: OS Command Injection Exploitation and Defense by Ankit Ekka (2.5 Minutes):

### Screen Action:
1. On Version 1 at `http://localhost:3000`, click the Diagnostics navigation tab.
2. In the Destination Node input of the Campus Server Diagnostics card, enter `127.0.0.1 & whoami`.
3. Click Execute Node Ping and display the terminal output showing `tojolegion\xeron` on screen.
4. In the Background System Diagnostics Archiver card, enter the time based blind payload `telemetry & ping -n 6 127.0.0.1`.
5. Click Schedule Diagnostics Task and show the execution duration clock registering a delay of over five seconds.
6. Open `IIITAOSCommunityForumV1/server/routes/diagnostics.js` to display the usage of `child_process.exec` with string concatenation.
7. Switch to Version 2 at `http://localhost:5000` and open the Diagnostics tab.
8. Enter `127.0.0.1 & whoami` and submit.
9. Show the immediate HTTP 400 rejection message stating command separators and shell metacharacters are rejected.
10. Open `IIITAOSCommunityForumV2/server/routes/diagnostics.js` to show `execFile` with argument vector separation and regex allow listing.

### Narration:
1. I am Ankit Ekka, roll number IIB2024012, and I am demonstrating the OS Command Injection category.
2. Our forum platform includes server diagnostics features enabling infrastructure coordinators to test connectivity and schedule telemetry tasks.
3. In Version 1, the backend uses `child_process.exec` and concatenates user input directly into system shell commands.
4. For in band command injection, when I supply `127.0.0.1 & whoami`, the shell interprets the ampersand as a command separator, executes `whoami`, and returns the active operating system user in the response.
5. For blind command injection, when I supply `telemetry & ping -n 6 127.0.0.1`, the server pauses for over five seconds while executing the ping delay before responding.
6. The root cause is passing unvalidated user input directly to a shell interpreter that assigns special execution meaning to metacharacters.
7. In Version 2, we eliminated the vulnerability using multiple defenses.
8. First, we completely avoid the shell by using `child_process.execFile` with `shell: false`, executing the ping binary with a separate argument vector array.
9. Second, we validate destination hosts against a strict regular expression allow list permitting only valid domain names or IP addresses.
10. Third, background archiver targets are validated against a static array of predefined approved identifiers.
11. On Version 2, any injected command is blocked at the perimeter without reaching the operating system.

## Act 4: Cross Site Scripting Exploitation and Defense by Dhannu Ram Meena (2.5 Minutes):

### Screen Action:
1. On Version 1 at `http://localhost:3000`, navigate to Discussions and click on Post 4: `Security Showcase: Interactive DOM Manipulation and Session Audit`.
2. Demonstrate rich stored XSS execution in the browser context without simple alerts.
3. Observe that the top navbar brand title immediately receives the animated red badge: `DOM HIJACKED BY XSS`.
4. Point out the extracted ambient session tokens and cookies displayed within the injected control panel widget.
5. Click the interactive button `Toggle Theme Inversion` to demonstrate live page color manipulation through injected JavaScript.
6. Click `Spawn Injected Alert Toast` to demonstrate dynamic UI injection spawning a floating notification toast.
7. Return to the main discussion feed and point out the dedicated disguised phishing ad placed directly beneath the search bar: `Claim Free IIIT-A Student Developer Swag Kit & AI Credits!`.
8. Explain that because reflected XSS attacks in the real world require phishing delivery, this ad disguises a malicious query link as a free student giveaway.
9. Click the button `Claim Free Swag Kit Now ->` or navigate to `http://localhost:3000/attackerPhishingAd.html` to simulate an external phishing link.
10. Demonstrate reflected XSS execution in Version 1, displaying the red glowing `Reflected XSS Executed` alert box below the search bar.
11. Open `IIITAOSCommunityForumV1/client/src/components/ContentRenderer.jsx` and `ForumView.jsx` to highlight unescaped `innerHTML` rendering.
12. Switch to Version 2 at `http://localhost:5000`.
13. Open Post 4 and demonstrate that DOMPurify sanitized the content completely: the navbar brand title remains pristine and un-tampered, no scripts execute, and no toasts appear.
14. Click the disguised search phishing ad on Version 2 and show that React framework auto escaping safely rendered the query as pure text, preventing all execution.
15. Inspect the network response headers in developer tools to highlight the Content Security Policy header.

### Narration:
1. I am Dhannu Ram Meena, roll number IIB2024033, and I am demonstrating the Cross Site Scripting category.
2. In Version 1, user submitted posts, comments, and search reflections are rendered directly into the DOM using `innerHTML` without sanitization.
3. Rather than demonstrating trivial alert dialogs, our stored XSS payload establishes interactive DOM and session takeover.
4. When a user opens the discussion, the injected payload extracts ambient session cookies, intercepts the navigation bar to append an animated takeover badge, and exposes interactive controls that invert site themes and spawn custom notification toasts.
5. Furthermore, to demonstrate how reflected XSS occurs in realistic threat scenarios through phishing and social engineering, we created a dedicated disguised search sponsorship ad offering a free student developer swag kit and AI credits.
6. When the victim clicks this disguised ad on the forum, or clicks a crafted link in our simulated phishing portal `attackerPhishingAd.html`, the malicious script is transmitted in the URL query parameter.
7. Because Version 1 reflects query parameters directly into `innerHTML`, the injected script executes immediately, creating a floating alert banner.
8. The root cause is rendering untrusted user input directly into executable DOM sinks without contextual sanitization.
9. In Version 2, we implemented multiple layers of defense.
10. First, `ContentRenderer.jsx` sanitizes all markup using DOMPurify, stripping script tags, error handlers, and dangerous attributes.
11. Second, reflected search terms are rendered strictly through React JSX text nodes, leveraging framework auto escaping.
12. Third, the Express backend sends a strict Content Security Policy HTTP header restricting script execution to authorized origin scripts.
13. Fourth, session cookies are configured with `HttpOnly: true`, preventing JavaScript from reading session identifiers even in the event of an injection.
14. On Version 2, both stored XSS and phishing delivered reflected XSS vectors are completely neutralized, keeping the interface clean and secure.

## Act 5: Cross Site Request Forgery Exploitation and Defense by Mridankan Mandal (2.5 Minutes):

### Screen Action:
1. On Version 1 at `http://localhost:3000`, log in as Dr. Mridankan Mandal (username `mridankan`, password `mridankan123`).
2. Navigate to Member Profiles and show the legitimate administrator profile biography.
3. Return to the Discussions tab and draw attention to the disguised campus partner ad cards embedded in the sidebar and main feed: `Claim 500 Free Cloud Compute Credits!`.
4. Demonstrate how an active forum member navigating the sidebar can accidentally click on the promotional ad card.
5. Show that clicking opens the CloudSphere student grant activation portal at `http://localhost:3000/attackerCsrfExploit.html`.
6. Explain how this disguised portal automatically dispatches an unauthorized POST request to `/api/auth/profile` using ambient cookies.
7. Return to the forum tab at `http://localhost:3000`, refresh Member Profiles, and show the hijacked administrator biography.
8. Show the secondary disguised ad link for campus domain vouchers at `http://localhost:3000/attackerCsrfGetExploit.html` to demonstrate the GET based forged action deleting a discussion.
9. Open `IIITAOSCommunityForumV1/server/routes/auth.js` to highlight missing anti CSRF tokens, absence of SameSite cookie directives, and absent origin checks.
10. Switch to Version 2 at `http://localhost:5000` and log in as Dr. Mridankan Mandal.
11. Click on the disguised campus partner ad on Version 2, loading `http://localhost:5000/attackerCsrfExploit.html`.
12. Observe the HTTP 403 Forbidden rejection when the forged request is submitted.
13. Open `http://localhost:5000/attackerCsrfGetExploit.html` and show the HTTP 405 Method Not Allowed rejection for GET state changes.
14. Return to Version 2 Member Profiles and confirm the biography remains unchanged.

### Narration:
1. I am Mridankan Mandal, roll number IIB2024017, and I am demonstrating the Cross Site Request Forgery category.
2. In Version 1, the backend processes state changing profile updates and post deletions relying purely on ambient browser session cookies.
3. To demonstrate real world attack delivery, we embedded a disguised campus partner advertisement directly on the forum website offering free cloud compute credits.
4. When a logged-in user accidentally clicks the ad while navigating discussions, the browser opens the promotional portal.
5. In the background, a hidden HTML form automatically submits forged profile data to our profile endpoint.
6. Because the browser automatically attaches stored cookies to outgoing cross site requests, the server updates the administrator profile without knowledge or consent.
7. Furthermore, state changing operations supported on GET requests can be triggered through image tags disguised as voucher vouchers.
8. The root cause is processing state changing requests without verifying user intent or requiring unpredictable proof of origin.
9. In Version 2, we deployed an industry standard multi layered defense.
10. First, we generate a cryptographically random 256 bit Anti CSRF synchronizer token on login and verify it via middleware on all state changing requests.
11. Second, session cookies are issued with `SameSite: strict` and `HttpOnly: true`, instructing the browser never to attach cookies on cross site submissions.
12. Third, our server middleware validates `Origin` and `Referer` headers against our trusted application domain.
13. Fourth, all state changing operations are strictly barred on HTTP GET requests.
14. When the disguised partner portal attempts to forge requests against Version 2, the server immediately rejects them with HTTP 403 Forbidden and HTTP 405 Method Not Allowed.

## Act 6: Conclusion and Summary (1 Minute):

### Screen Action:
1. Show both running servers side by side in terminal and browser.
2. Display the repository README table mapping members to their implemented variants.

### Narration:
1. In summary, our team has demonstrated the working exploitation and multi layered remediation of all four vulnerability categories.
2. We have contrasted insecure code patterns against production grade defensive architectures across both versions.
3. Thank you for watching our demonstration.
