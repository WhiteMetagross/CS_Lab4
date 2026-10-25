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
const PORT = process.env.PORT || 3000;

getDB();

app.use(cors({
  origin: true,
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

app.listen(PORT, () => {
  console.log('IIIT Allahabad Open Source Community Forum Version 1 running on port ' + PORT);
});
