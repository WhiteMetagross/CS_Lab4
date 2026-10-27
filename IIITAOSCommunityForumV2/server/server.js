const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getDB, resetDatabase } = require('./database');
const { router: authRouter, authenticate } = require('./routes/auth');
const postsRouter = require('./routes/posts');
const chatRouter = require('./routes/chat');
const diagnosticsRouter = require('./routes/diagnostics');

const app = express();
const PORT = process.env.PORT || 5000;

getDB();

//Defense: Content Security Policy header blocking inline script execution and unauthorized origins.
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';");
  next();
});

//Defense: Strict CORS policy restricting requests to trusted application domain.
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticate);

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/diagnostics', diagnosticsRouter);

app.post('/api/admin/reset-db', (req, res) => {
  resetDatabase();
  return res.json({ message: 'Database reset to default community seed data.' });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const publicPath = path.join(__dirname, '..', 'public');

if (require('fs').existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.use(express.static(publicPath));
  app.use((req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log('IIIT Allahabad Open Source Community Forum Version 2 running on port ' + PORT);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: Port ' + PORT + ' is already in use by an active server process.');
    process.exit(1);
  } else {
    console.error('Server startup error:', err.message);
  }
});
