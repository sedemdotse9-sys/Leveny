/* ============================================================
   LEVENY BACKEND
   A small local Express server that handles:
     - Sign up (username + email + password)
     - Login (username OR email + password)
     - Profile picture upload / remove
     - Change password
   Users are stored in users.json in this folder. Passwords are
   never stored in plain text — only a bcrypt hash is saved.
============================================================ */

const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

/* ---------- helpers ---------- */
function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUser(users, identifier) {
  const lower = String(identifier || '').toLowerCase();
  return users.find(
    (u) => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower
  );
}

function publicUser(u) {
  if (!u) return null;
  return {
    username: u.username,
    email: u.email,
    avatar: u.avatar || null,
    watchHistory: u.watchHistory || [],
    downloads: u.downloads || []
  };
}

const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- middleware ---------- */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const username = (req.body.username || 'user').replace(/[^a-zA-Z0-9_.-]/g, '');
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${username}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

/* ============================================================
   ROUTES
============================================================ */

// --- Sign up ---
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are all required.' });
  }
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore, or dot).' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = loadUsers();

  if (findUser(users, username)) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }
  if (findUser(users, email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = { username, email, passwordHash, avatar: null, watchHistory: [], downloads: [] };
  users.push(newUser);
  saveUsers(users);

  res.json({ user: publicUser(newUser) });
});

// --- Login ---
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your username/email and password.' });
  }

  const users = loadUsers();
  const user = findUser(users, identifier);

  if (!user) {
    return res.status(401).json({ error: 'No account found with that username or email.' });
  }
  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  res.json({ user: publicUser(user) });
});

// --- Get current user info (used by dashboard to refresh avatar/email) ---
app.get('/api/user/:username', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

// --- Upload / change profile picture ---
app.post('/api/profile-picture', upload.single('avatar'), (req, res) => {
  const { username } = req.body;
  if (!username || !req.file) {
    return res.status(400).json({ error: 'Missing username or image file.' });
  }

  const users = loadUsers();
  const user = findUser(users, username);
  if (!user) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'User not found.' });
  }

  // remove old avatar file if present
  if (user.avatar) {
    const oldPath = path.join(__dirname, user.avatar);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.avatar = `/uploads/${req.file.filename}`;
  saveUsers(users);

  res.json({ avatar: user.avatar });
});

// --- Remove profile picture ---
app.delete('/api/profile-picture/:username', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (user.avatar) {
    const oldPath = path.join(__dirname, user.avatar);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  user.avatar = null;
  saveUsers(users);

  res.json({ success: true });
});

// --- Change password ---
app.post('/api/change-password', (req, res) => {
  const { username, currentPassword, newPassword } = req.body || {};
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const users = loadUsers();
  const user = findUser(users, username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  saveUsers(users);

  res.json({ success: true });
});

// --- Log or update watch progress for a movie ---
// Called from a movie page whenever playback starts/progresses.
// Upserts by movieId: if the movie is already in history, updates its
// position and moves it to the top; otherwise adds a new entry.
app.post('/api/watch-history', (req, res) => {
  const { username, movieId, title, background, runtimeMinutes, positionMinutes } = req.body || {};

  if (!username || !movieId || !title) {
    return res.status(400).json({ error: 'username, movieId, and title are required.' });
  }

  const users = loadUsers();
  const user = findUser(users, username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (!user.watchHistory) user.watchHistory = [];

  const entry = {
    movieId,
    title,
    background: background || null,
    runtimeMinutes: Number(runtimeMinutes) || 0,
    positionMinutes: Number(positionMinutes) || 0,
    lastWatched: new Date().toISOString()
  };

  user.watchHistory = user.watchHistory.filter((h) => h.movieId !== movieId);
  user.watchHistory.unshift(entry);
  user.watchHistory = user.watchHistory.slice(0, 100); // cap history length

  saveUsers(users);
  res.json({ watchHistory: user.watchHistory });
});

// --- Get watch history ---
app.get('/api/watch-history/:username', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ watchHistory: user.watchHistory || [] });
});

// --- Remove a single watch history entry ---
app.delete('/api/watch-history/:username/:movieId', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.watchHistory = (user.watchHistory || []).filter((h) => h.movieId !== req.params.movieId);
  saveUsers(users);
  res.json({ watchHistory: user.watchHistory });
});

// --- Log a download ---
// Called from a movie page's Download button after it triggers the
// actual browser file download. This just records that it happened,
// so the dashboard can show/re-trigger/remove it later.
app.post('/api/downloads', (req, res) => {
  const { username, movieId, title, poster, videoUrl } = req.body || {};

  if (!username || !movieId || !title || !videoUrl) {
    return res.status(400).json({ error: 'username, movieId, title, and videoUrl are required.' });
  }

  const users = loadUsers();
  const user = findUser(users, username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (!user.downloads) user.downloads = [];

  const entry = {
    movieId,
    title,
    poster: poster || null,
    videoUrl,
    downloadedAt: new Date().toISOString()
  };

  user.downloads = user.downloads.filter((d) => d.movieId !== movieId);
  user.downloads.unshift(entry);

  saveUsers(users);
  res.json({ downloads: user.downloads });
});

// --- Get downloads list ---
app.get('/api/downloads/:username', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ downloads: user.downloads || [] });
});

// --- Remove a download entry ---
app.delete('/api/downloads/:username/:movieId', (req, res) => {
  const users = loadUsers();
  const user = findUser(users, req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.downloads = (user.downloads || []).filter((d) => d.movieId !== req.params.movieId);
  saveUsers(users);
  res.json({ downloads: user.downloads });
});

/* ---------- start server ---------- */
app.listen(PORT, () => {
  console.log(`Leveny server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/profile.html to get started`);
});
