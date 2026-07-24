require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const Task = require("./models/Task");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Defer the session store to Mongoose's own connection (one DB connection,
// avoids a second TLS handshake that some networks reject).
let resolveClient;
const clientPromise = new Promise((resolve) => (resolveClient = resolve));

// Trust the hosting proxy (Render/Heroku) so secure cookies work over HTTPS.
app.set("trust proxy", 1);

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" })); // room for small base64 avatars
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ clientPromise }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: "auto", // becomes secure automatically when served over HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// --- Passport setup ---
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// Email + password
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: (email || "").toLowerCase() });
      if (!user) return done(null, false, { message: "No account with that email" });
      const ok = await user.checkPassword(password);
      if (!ok) return done(null, false, { message: "Incorrect password" });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Google (only if credentials are configured)
if (GOOGLE_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          let user = await User.findOne({ googleId: profile.id });
          if (!user && email) user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            user = await User.create({
              name: profile.displayName || "Google User",
              email: email ? email.toLowerCase() : `google_${profile.id}@example.com`,
              googleId: profile.id,
              avatar: profile.photos && profile.photos[0] && profile.photos[0].value,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// --- Auth guard ---
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}

// --- Auth routes ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with that email already exists" });

    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Login after signup failed" });
      res.status(201).json(user.toPublic());
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Could not create account" });
  }
});

app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: (info && info.message) || "Login failed" });
    req.login(user, (err2) => {
      if (err2) return next(err2);
      res.json(user.toPublic());
    });
  })(req, res, next);
});

app.post("/api/auth/logout", (req, res) => {
  req.logout(() => res.json({ success: true }));
});

app.get("/api/auth/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.json(req.user.toPublic());
  res.status(401).json({ error: "Not authenticated" });
});

// Profile update (name / avatar)
app.put("/api/auth/me", requireAuth, async (req, res) => {
  try {
    if (typeof req.body.name === "string" && req.body.name.trim()) req.user.name = req.body.name.trim();
    if (typeof req.body.avatar === "string") req.user.avatar = req.body.avatar;
    await req.user.save();
    res.json(req.user.toPublic());
  } catch (err) {
    res.status(500).json({ error: "Could not update profile" });
  }
});

// Google OAuth
app.get("/api/auth/config", (req, res) => res.json({ google: GOOGLE_ENABLED }));
if (GOOGLE_ENABLED) {
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login.html" }),
    (req, res) => res.redirect("/index.html")
  );
}

// --- Task routes (all user-scoped) ---
app.get("/api/tasks", requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/tasks", requireAuth, async (req, res) => {
  try {
    const data = { text: req.body.text, owner: req.user.id };
    if (req.body.date) {
      const d = new Date(req.body.date);
      if (!isNaN(d)) data.date = d;
    }
    if (["low", "medium", "high"].includes(req.body.priority)) data.priority = req.body.priority;
    if (typeof req.body.category === "string") data.category = req.body.category;
    if (typeof req.body.notes === "string") data.notes = req.body.notes;
    const task = await Task.create(data);
    res.status(201).json(task);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.text === "string") updates.text = req.body.text;
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;
    if (["low", "medium", "high"].includes(req.body.priority)) updates.priority = req.body.priority;
    if (typeof req.body.category === "string") updates.category = req.body.category;
    if (typeof req.body.notes === "string") updates.notes = req.body.notes;
    if (req.body.date) {
      const d = new Date(req.body.date);
      if (!isNaN(d)) updates.date = d;
    }
    if (Array.isArray(req.body.subtasks)) {
      updates.subtasks = req.body.subtasks
        .filter((s) => s && typeof s.text === "string")
        .map((s) => ({ text: s.text.slice(0, 200), done: !!s.done }));
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid task id" });
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ success: true });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "Invalid task id" });
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// --- Root: login first, or home if already signed in ---
app.get("/", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect("/index.html");
  res.redirect("/login.html");
});

// --- Static files (after routes) ---
app.use(express.static(path.join(__dirname, "public")));

// --- Database connection (cached so serverless invocations reuse it) ---
let dbPromise = null;
function connectDB() {
  if (!MONGODB_URI) return Promise.reject(new Error("Missing MONGODB_URI"));
  if (!dbPromise) {
    dbPromise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .then((conn) => {
        resolveClient(conn.connection.getClient()); // hand the live client to the session store
        console.log("Connected to MongoDB");
        console.log(GOOGLE_ENABLED ? "Google login: enabled" : "Google login: disabled (no credentials)");
        return conn;
      })
      .catch((err) => {
        dbPromise = null; // don't cache the failure — let the next request retry
        throw err;
      });
  }
  return dbPromise;
}

// Start connecting as soon as the module loads (covers both local and serverless).
connectDB().catch((err) => console.error("MongoDB connection error:", err.message));

// Local development: run a normal always-on server.
// On a serverless host (Vercel) this file is imported, so this block is skipped.
if (require.main === module) {
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
    .catch(() => process.exit(1));
}

// Export the Express app so Vercel can use it as the serverless handler.
module.exports = app;
