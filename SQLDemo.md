# SQL Injection Demonstration and Defense Manual:

### Web Application: IIIT Allahabad Open Source Community Forum:
### Assigned Presenter: Dhannu Ram Meena (Roll Number: IIB2024033):
### Focus Variant: Authentication Login Bypass:

---

## 1. What is SQL Injection:

1. Technical Definition:
   SQL Injection (SQLi) is an injection flaw occurring when untrusted user input is directly concatenated or interpolated into a dynamic database query string without prior sanitization, contextual escaping, or token parameterization.
2. The Code Versus Data Dilemma:
   Database engines parse incoming commands using a grammar interpreter. When user data contains SQL metacharacters (such as single quotes `'`, double dashes `--`, or boolean keywords `OR`, `AND`), the database interpreter cannot distinguish between the structure of the SQL query designed by the programmer and the input data provided by the user.
3. Real World Threat Impact:
   SQL injection enables adversaries to bypass authentication barriers, extract confidential records (such as passwords, credit card numbers, or personally identifiable data), alter or corrupt database entries, and in some database configurations, execute arbitrary operating system commands on the host machine.

---

## 2. How the Authentication Bypass Exploit Happens:

1. Insecure Code Logic in Version 1:
   The login handler in [auth.js (V1)](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/auth.js) constructs raw SQL using direct string concatenation:
   ```javascript
   const rawQuery = "SELECT id, username, password, full_name, role, bio FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
   const user = db.prepare(rawQuery).get();
   ```
2. Attacker Input:
   - Username Field: `mridankan' --`
   - Password Field: `arbitraryPassword`
3. Syntactic Parsing by Database Engine:
   When concatenated into the string, the query becomes:
   ```sql
   SELECT id, username, password, full_name, role, bio FROM users WHERE username = 'mridankan' --' AND password = 'arbitraryPassword'
   ```
4. Step by Step Mechanics:
   - The first single quotation mark after `mridankan` closes the SQL literal string prematurely.
   - The double dash sequence `--` instructs the SQLite engine that all subsequent text on that line is a comment.
   - The engine discards `' AND password = 'arbitraryPassword'`, eliminating the password check completely.
   - The query evaluates solely as `SELECT ... WHERE username = 'mridankan'`. Because a user named `mridankan` exists, the record is retrieved.
   - The application creates a session token for Administrator Dr. Mridankan Mandal and logs the attacker in with full administrative privileges.

---

## 3. How SQL Injection is Defended:

### Defense 1: Parameterized Prepared Statements:
1. Mechanism:
   Instead of concatenating raw strings, the query is pre-compiled with parameter placeholders (`?`). The database engine compiles and plans the SQL statement structure once before binding data values.
2. Implementation:
   When `mridankan' --` is passed into a bound parameter, SQLite treats the quotation mark and double dash strictly as literal characters belonging to the username itself, rather than executable SQL control syntax. The database searches for a literal username named `mridankan' --`, finds no match, and rejects the authentication.

### Defense 2: Input Validation Allow Lists:
1. Mechanism:
   All incoming fields are verified against strict alphanumeric regular expression patterns prior to query execution.
2. Implementation:
   A regular expression allow list `/^[a-zA-Z0-9_]{3,30}$/` verifies that usernames contain only valid alphanumeric characters and underscores. If an attacker inputs `'`, spaces, or `--`, the request is rejected immediately at the application boundary with HTTP 400 Bad Request before ever reaching the database.

### Defense 3: Safe Generic Error Handling:
1. Mechanism:
   Database errors and authentication failures return generic neutral messages such as `Invalid username or password.` rather than database stack traces or SQL syntax errors, preventing attackers from performing database schema fingerprinting.

---

## 4. Source Code Comparison:

### Vulnerable Source Code:
File Location: [IIITAOSCommunityForumV1/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/auth.js)
```javascript
//This does authenticate users via string concatenated SQL query vulnerable to SQL injection.
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const db = getDB();
  const rawQuery = "SELECT id, username, password, full_name, role, bio FROM users WHERE username = '" + username + "' AND password = '" + password + "'";

  try {
    const user = db.prepare(rawQuery).get();
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    //Session token generated and returned...
  } catch (err) {
    return res.status(500).json({ error: 'Database query execution error: ' + err.message });
  }
});
```

### Hardened Defended Source Code:
File Location: [IIITAOSCommunityForumV2/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/auth.js)
```javascript
//Defense: Parameterized queries, strict input allow lists, and safe generic error responses against SQL injection.
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  //Defense: Input validation allow list rejecting SQL metacharacters.
  const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernamePattern.test(username.trim())) {
    return res.status(400).json({ error: 'Invalid username format. Disallowed characters detected.' });
  }

  const db = getDB();
  //Defense: Parameterized prepared statement treating input as pure literal data.
  const user = db.prepare('SELECT id, username, password, full_name, role, bio FROM users WHERE username = ?').get(username.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  //Session token generated and returned...
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
2. Click the `Log In` button in the top right navbar.
3. In the Username field, type:
   `mridankan' --`
4. In the Password field, type any arbitrary incorrect password:
   `wrongpass123`
5. Click `Sign In`.
6. Observe the result:
   The login modal closes and you are immediately authenticated as `Dr. Mridankan Mandal` with the red `Administrator` badge displayed in the top navbar.
   No valid password was supplied, demonstrating complete authentication bypass.
7. Open [IIITAOSCommunityForumV1/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/auth.js) in your code editor to highlight the dynamic string concatenation on line 72.

### Step 3: Demonstrating the Defense on Version 2 (`http://localhost:5000`):
1. Switch browser tab to `http://localhost:5000`.
2. Click the `Log In` button in the top right navbar.
3. In the Username field, type the exact same payload:
   `mridankan' --`
4. In the Password field, type:
   `wrongpass123`
5. Click `Sign In`.
6. Observe the result:
   The attack is immediately blocked.
   A red alert banner appears inside the modal: `Invalid username format. Disallowed characters detected.`
   No authentication occurs, and the server rejects the request with HTTP 400 Bad Request.
7. Open [IIITAOSCommunityForumV2/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/auth.js) in your code editor to highlight:
   Line 139: Alphanumeric regular expression allow list.
   Line 146: Parameterized prepared statement with placeholder `?`.

---

## 6. Spoken Presentation and Video Demonstration Script:

### Presenter: Dhannu Ram Meena (Roll Number: IIB2024033)
### Target Duration: 2 to 2.5 Minutes

### Visual Screen Action:
1. Show browser tab open at `http://localhost:3000`.
2. Click `Log In` in the navbar.
3. Type `mridankan' --` into the username field and `wrongpass123` into the password field.
4. Click `Sign In` and show the active `Administrator` session badge appearing in the navbar.
5. Open Visual Studio Code showing file [IIITAOSCommunityForumV1/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV1/server/routes/auth.js) at line 72.
6. Switch browser tab to `http://localhost:5000`.
7. Click `Log In`, enter `mridankan' --` and `wrongpass123`, and click `Sign In`.
8. Show the red error banner displaying `Invalid username format. Disallowed characters detected.`
9. Open Visual Studio Code showing file [IIITAOSCommunityForumV2/server/routes/auth.js](file:///c:/Users/Xeron/Desktop/IIIT-ACourseWork/CSLabAssignment4_IIB2024017/IIITAOSCommunityForumV2/server/routes/auth.js) highlighting the regex allow list and parameterized prepared statement.

### Spoken Narration:
1. Hello everyone. I am Dhannu Ram Meena, roll number IIB2024033, and I am demonstrating the SQL Injection category.
2. SQL injection occurs when an application concatenates untrusted user input directly into dynamic database query strings. Because the database engine parses code and data within the same stream, an attacker can supply SQL metacharacters that change the command structure.
3. On Version 1 running on port 3000, our authentication login route is vulnerable to an authentication bypass attack.
4. When I open the login modal and supply the username `mridankan' --` with an arbitrary incorrect password, the single quotation mark prematurely closes the username literal string.
5. Next, the double dash sequence instructs the SQLite engine to treat the remainder of the query as a comment, completely discarding the password verification clause.
6. As you can see on screen, clicking Sign In logs us directly into the forum as Administrator Dr. Mridankan Mandal without requiring a password.
7. Looking at the vulnerable source code in `IIITAOSCommunityForumV1/server/routes/auth.js`, we can see the root cause: the username and password variables are concatenated directly into the raw SQL query string.
8. Now let us switch to our defended application, Version 2, running on port 5000.
9. When I submit the identical exploit payload `mridankan' --`, the application immediately rejects the attempt with HTTP 400 Bad Request, displaying `Invalid username format. Disallowed characters detected.`
10. Looking at our defense implementation in `IIITAOSCommunityForumV2/server/routes/auth.js`, we deployed two layers of defense.
11. First, an alphanumeric regular expression allow list verifies that the username contains only valid alphanumeric characters and underscores, rejecting quotes and comment dashes at the application perimeter.
12. Second, database queries are strictly executed using parameterized prepared statements with `db.prepare` and placeholder parameter markers. This guarantees that SQLite compiles the query structure first, binding all user input purely as literal text rather than executable SQL syntax.
13. Through input validation and query parameterization, SQL injection attacks are completely neutralized.
