// SERVER/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const pool = require("./db");

console.log("[BOOT] Server starting", new Date().toISOString());
console.log("[BOOT] Reviews route mounted");

app.use(cors());
app.use(express.json());

// -------- Projects --------
app.get("/api/projects", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB error");
  }
});

// -------- Contact --------
app.post("/api/contact", async (req, res) => {
  try {
    console.log("Incoming /api/contact body:", req.body);

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Accept rating even if it's a string; coerce safely
    const r = Number.isFinite(Number(body.rating)) ? parseInt(body.rating, 10) : NaN;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email, and message are required." });
    }
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be an integer 1–5." });
    }

    const sql = `
      INSERT INTO contact_messages (name, email, message, rating)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, rating
    `;
    const { rows } = await pool.query(sql, [name, email, message, r]);

    return res.status(201).json({
      message: "Message received!",
      id: rows[0].id,
      created_at: rows[0].created_at,
      rating: rows[0].rating
    });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// -------- Public Reviews (read-only) --------
app.get("/api/reviews", async (req, res) => {
  try {
    const minRating = Math.max(1, Math.min(5, parseInt(req.query.minRating || "1", 10)));
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const offset = parseInt(req.query.offset || "0", 10);

    const { rows } = await pool.query(
      `SELECT id, name, message, rating, created_at
       FROM contact_messages
       WHERE rating >= $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [minRating, limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- ADMIN: bootstrap users -------------------- */
async function ensureAdmins() {
  const admins = [
    { username: "awsam", password: "1601" },
    { username: "bisan", password: "1601" },
  ];

  for (const a of admins) {
    const { rows } = await pool.query(
      "SELECT id FROM admin_users WHERE username=$1",
      [a.username]
    );
    if (!rows.length) {
      const hash = await bcrypt.hash(a.password, 12);
      await pool.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1,$2)",
        [a.username, hash]
      );
      console.log(`[SEED] Created admin ${a.username}`);
    }
  }
}
ensureAdmins().catch((e) => console.error("[SEED ERROR]", e));

/* -------------------- ADMIN: minimal schema for panel -------------------- */
// Only creates what’s missing. Safe to keep running.
async function ensureAdminPanelSchema() {
  try {
    // Blog posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        html TEXT NOT NULL,
        cover_image_url TEXT,
        video_embed_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at TIMESTAMPTZ
      );
    `);

    // Media links (images/videos kept as URLs or embed codes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id SERIAL PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('image','video')),
        title TEXT,
        url TEXT NOT NULL,
        embed_code TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // CV / resume items (timeline)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resume_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,          -- e.g., "Fullstack Developer"
        org TEXT,                     -- e.g., "Tel-Hai"
        description TEXT,             -- rich text or plain
        start_year INT,
        end_year INT,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Contact moderation flags (add columns if they don't exist)
    await pool.query(`ALTER TABLE contact_messages
      ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
    `);

    // Helpful triggers to auto-update updated_at on blog_posts
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'blog_posts_set_updated_at'
        ) THEN
          CREATE TRIGGER blog_posts_set_updated_at
          BEFORE UPDATE ON blog_posts
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
    `);

    console.log("[SCHEMA] Admin panel tables/columns ensured.");
  } catch (e) {
    console.error("[SCHEMA ERROR]", e);
  }
}
ensureAdminPanelSchema();

/* -------------------- ADMIN: auth -------------------- */
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

// middleware
function adminAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, username, role }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const { rows } = await pool.query(
    "SELECT id, username, password_hash, role FROM admin_users WHERE username=$1",
    [username]
  );
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: rows[0].id, username: rows[0].username, role: rows[0].role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
  await pool.query("UPDATE admin_users SET last_login = now() WHERE id=$1", [rows[0].id]);

  return res.json({
    token,
    user: { id: rows[0].id, username: rows[0].username, role: rows[0].role },
  });
});

// example protected route (you’ll add your admin APIs here)
app.get("/api/admin/me", adminAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

/* -------------------- ADMIN: Projects CRUD -------------------- */
// Create project
app.post("/api/admin/projects", adminAuth, async (req, res) => {
  try {
    const {
      title, summary, image_url, github_url, youtube_url, embed_code, tech_stack,
    } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO projects (title, summary, image_url, github_url, youtube_url, embed_code, tech_stack)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title||"", summary||"", image_url||null, github_url||null, youtube_url||null, embed_code||null, tech_stack||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin projects create]", e);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// Update project
app.put("/api/admin/projects/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      title, summary, image_url, github_url, youtube_url, embed_code, tech_stack,
    } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE projects SET
         title=COALESCE($2,title),
         summary=COALESCE($3,summary),
         image_url=COALESCE($4,image_url),
         github_url=COALESCE($5,github_url),
         youtube_url=COALESCE($6,youtube_url),
         embed_code=COALESCE($7,embed_code),
         tech_stack=COALESCE($8,tech_stack)
       WHERE id=$1
       RETURNING *`,
      [id, title, summary, image_url, github_url, youtube_url, embed_code, tech_stack]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin projects update]", e);
    res.status(500).json({ message: "Failed to update project" });
  }
});

// Delete project
app.delete("/api/admin/projects/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM projects WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin projects delete]", e);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

/* -------------------- ADMIN: Media (images/videos as links) -------------------- */
app.post("/api/admin/media", adminAuth, async (req, res) => {
  try {
    const { kind, title, url, embed_code } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO media_assets (kind, title, url, embed_code)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [kind, title||null, url, embed_code||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin media create]", e);
    res.status(500).json({ message: "Failed to create media" });
  }
});

app.delete("/api/admin/media/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM media_assets WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin media delete]", e);
    res.status(500).json({ message: "Failed to delete media" });
  }
});

/* -------------------- ADMIN: Resume / CV timeline -------------------- */
app.post("/api/admin/resume", adminAuth, async (req, res) => {
  try {
    const { title, org, description, start_year, end_year, order_index } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO resume_items (title, org, description, start_year, end_year, order_index)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [title, org||null, description||null, start_year||null, end_year||null, order_index||0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin resume create]", e);
    res.status(500).json({ message: "Failed to create resume item" });
  }
});

app.put("/api/admin/resume/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, org, description, start_year, end_year, order_index } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE resume_items SET
        title=COALESCE($2,title),
        org=COALESCE($3,org),
        description=COALESCE($4,description),
        start_year=COALESCE($5,start_year),
        end_year=COALESCE($6,end_year),
        order_index=COALESCE($7,order_index)
       WHERE id=$1
       RETURNING *`,
      [id, title, org, description, start_year, end_year, order_index]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin resume update]", e);
    res.status(500).json({ message: "Failed to update resume item" });
  }
});

app.delete("/api/admin/resume/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM resume_items WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin resume delete]", e);
    res.status(500).json({ message: "Failed to delete resume item" });
  }
});

/* -------------------- ADMIN: Blog posts (CRUD + publish) -------------------- */
app.post("/api/admin/blog", adminAuth, async (req, res) => {
  try {
    const { title, slug, html, cover_image_url, video_embed_url, is_published } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO blog_posts (title, slug, html, cover_image_url, video_embed_url, is_published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $6 THEN now() ELSE NULL END)
       RETURNING *`,
      [title, slug, html, cover_image_url||null, video_embed_url||null, !!is_published]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin blog create]", e);
    res.status(500).json({ message: "Failed to create post (slug unique?)" });
  }
});

app.put("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, slug, html, cover_image_url, video_embed_url } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE blog_posts SET
        title=COALESCE($2,title),
        slug=COALESCE($3,slug),
        html=COALESCE($4,html),
        cover_image_url=COALESCE($5,cover_image_url),
        video_embed_url=COALESCE($6,video_embed_url)
       WHERE id=$1
       RETURNING *`,
      [id, title, slug, html, cover_image_url, video_embed_url]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin blog update]", e);
    res.status(500).json({ message: "Failed to update post" });
  }
});

app.patch("/api/admin/blog/:id/publish", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { publish } = req.body || {};
    const pub = !!publish;
    const { rows } = await pool.query(
      `UPDATE blog_posts
       SET is_published=$2,
           published_at=CASE WHEN $2 THEN now() ELSE NULL END
       WHERE id=$1
       RETURNING *`,
      [id, pub]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin blog publish]", e);
    res.status(500).json({ message: "Failed to change publish state" });
  }
});

app.delete("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM blog_posts WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin blog delete]", e);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

/* -------------------- ADMIN: Contact moderation -------------------- */
app.get("/api/admin/contact", adminAuth, async (req, res) => {
  try {
    const show = (req.query.show || "all").toLowerCase(); // all | unread | archived
    let where = "1=1";
    if (show === "unread") where = "reviewed = false AND archived = false";
    if (show === "archived") where = "archived = true";
    const { rows } = await pool.query(
      `SELECT id, name, email, message, rating, created_at, reviewed, archived
       FROM contact_messages
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error("[admin contact list]", e);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

app.patch("/api/admin/contact/:id/review", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reviewed = true } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE contact_messages SET reviewed=$2 WHERE id=$1 RETURNING *`,
      [id, !!reviewed]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin contact review]", e);
    res.status(500).json({ message: "Failed to update review state" });
  }
});

app.patch("/api/admin/contact/:id/archive", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { archived = true } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE contact_messages SET archived=$2 WHERE id=$1 RETURNING *`,
      [id, !!archived]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin contact archive]", e);
    res.status(500).json({ message: "Failed to update archive state" });
  }
});

app.delete("/api/admin/contact/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM contact_messages WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin contact delete]", e);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

/* -------------------- Health & debug (unchanged) -------------------- */
app.get("/", (_req, res) => res.send("API up"));

// ---- DEBUG: list all mounted routes on boot ----
function logRoutes() {
  try {
    console.log("[BOOT] Listing routes:");
    app._router.stack
      .filter((l) => l.route && l.route.path)
      .forEach((l) => {
        const methods = Object.keys(l.route.methods).join(",").toUpperCase();
        console.log(`  ${methods.padEnd(10)} ${l.route.path}`);
      });
  } catch (e) {
    console.log("[BOOT] Could not list routes:", e);
  }
}

// quick debug endpoint to view routes from the browser
app.get("/__routes", (_req, res) => {
  const routes = [];
  (app._router.stack || []).forEach((l) => {
    if (l.route && l.route.path) {
      routes.push({
        path: l.route.path,
        methods: Object.keys(l.route.methods),
      });
    }
  });
  res.json({ ok: true, routes });
});

// -------- Start server (always last) --------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  logRoutes(); // <-- must print all routes including /api/reviews
});
